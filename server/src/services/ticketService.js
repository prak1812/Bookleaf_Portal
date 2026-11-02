const Ticket = require('../models/Ticket');
const Book = require('../models/Book');
const HttpError = require('../utils/httpError');

// Fields an author must never see (notes and replies live in the same document, so we strip here).
const AUTHOR_HIDDEN = ['aiDraft', 'aiReasoning', 'priority', 'prioritySource',
  'categorySource', 'assignedTo', 'notes'];
const toAuthorView = (ticket) => {
  const copy = ticket.toJSON();
  AUTHOR_HIDDEN.forEach((key) => delete copy[key]);
  return copy;
};

// Admin queue order: open tickets first, then most urgent, then oldest.
const PRIORITY_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const isClosed = (t) => (t.status === 'Resolved' || t.status === 'Closed' ? 1 : 0);
const queueOrder = (a, b) =>
  isClosed(a) - isClosed(b) ||
  (PRIORITY_RANK[a.priority] ?? 4) - (PRIORITY_RANK[b.priority] ?? 4) ||
  a.createdAt - b.createdAt;

// populate() swaps an id for a small summary: author -> { id, name }
const withNames = (query) =>
  query.populate('author', 'name').populate('book', 'title').populate('assignedTo', 'name');

async function createTicket(authorId, { bookId, subject, description }) {
  if (bookId) {
    const owned = await Book.exists({ _id: bookId, author: authorId });
    if (!owned) throw new HttpError(400, 'INVALID_BOOK', 'That book is not on your account');
  }
  return Ticket.create({ author: authorId, book: bookId || null, subject, description });
}

async function listTickets(user, f = {}) {
  if (user.role === 'author') {
    // Authors: only their own tickets, latest activity first. Filters are ignored on purpose.
    const mine = await Ticket.find({ author: user.id }).sort({ updatedAt: -1 }).populate('book', 'title');
    return mine.map(toAuthorView);
  }

  const filter = {};
  if (f.status) filter.status = f.status;
  if (f.category) filter.category = f.category;
  if (f.priority) filter.priority = f.priority;
  if (f.assigned === 'me') filter.assignedTo = user.id;
  if (f.assigned === 'unassigned') filter.assignedTo = null;
  if (f.from || f.to) {
    filter.createdAt = {};
    if (f.from) filter.createdAt.$gte = new Date(`${f.from}T00:00:00.000Z`);
    if (f.to) filter.createdAt.$lte = new Date(`${f.to}T23:59:59.999Z`);
  }

  // The queue does not need replies, notes or drafts: leave the heavy fields out.
  const tickets = await withNames(Ticket.find(filter).select('-replies -notes -aiDraft'));
  return tickets.sort(queueOrder);
}

async function getTicket(user, id) {
  const ticket = await withNames(Ticket.findById(id));
  // 404 (not 403) when it is someone else's ticket, so its existence is not revealed.
  if (!ticket || (user.role === 'author' && String(ticket.author._id) !== user.id)) {
    throw new HttpError(404, 'TICKET_NOT_FOUND', 'Ticket not found');
  }
  return user.role === 'author' ? toAuthorView(ticket) : ticket;
}

// Admin changes. Only the fields that were sent are touched.
async function updateTicket(admin, id, f) {
  const set = {};
  if (f.status) set.status = f.status;
  if (f.category) { set.category = f.category; set.categorySource = 'admin'; }
  if (f.priority) { set.priority = f.priority; set.prioritySource = 'admin'; }
  if (f.assignedTo !== undefined) set.assignedTo = f.assignedTo === 'me' ? admin.id : null;

  const updated = await Ticket.findByIdAndUpdate(id, { $set: set }, { runValidators: true });
  if (!updated) throw new HttpError(404, 'TICKET_NOT_FOUND', 'Ticket not found');
  return getTicket(admin, id);
}

async function addReply(admin, id, body) {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new HttpError(404, 'TICKET_NOT_FOUND', 'Ticket not found');

  ticket.replies.push({ sender: admin.id, senderName: admin.name, senderRole: 'admin', body });
  ticket.replyCount = ticket.replies.length;
  // Replying moves Open -> In Progress and claims the ticket if nobody owns it.
  if (ticket.status === 'Open') ticket.status = 'In Progress';
  if (!ticket.assignedTo) ticket.assignedTo = admin.id;
  await ticket.save();
  return getTicket(admin, id);
}

async function addNote(admin, id, body) {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new HttpError(404, 'TICKET_NOT_FOUND', 'Ticket not found');

  ticket.notes.push({ admin: admin.id, adminName: admin.name, body });
  await ticket.save();
  return getTicket(admin, id);
}

module.exports = { createTicket, listTickets, getTicket, updateTicket, addReply, addNote };