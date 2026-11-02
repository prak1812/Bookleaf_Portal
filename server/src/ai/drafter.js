const Ticket = require('../models/Ticket');
const Book = require('../models/Book');
const ai = require('./client');
const { draftSystem, draftUser } = require('./prompts');
const { nextPayoutDeadline } = require('./payout');

// prompts.js (8.4) reads these key names. This adapter keeps the prompt layer
// independent of how the database names its fields.
const toPromptBook = (b) => ({
  title: b.title,
  status: b.status,
  isbn: b.isbn,
  publication_date: b.publicationDate,
  mrp: b.mrp,
  copies_sold: b.copiesSold,
  royalty_earned: b.royaltyEarned,
  royalty_paid: b.royaltyPaid,
  royalty_pending: b.royaltyPending,
});

async function loadBookContext(ticket) {
  if (ticket.book) {
    const book = await Book.findById(ticket.book);
    if (book) return toPromptBook(book);
  }
  // General / Account Level ticket: send a compact summary of all the author's books.
  const books = await Book.find({ author: ticket.author._id });
  const sum = (key) => books.reduce((total, b) => total + b[key], 0);
  const list = books.map((b) => `${b.title} (${b.status})`).join('; ');
  return {
    accountSummary: `Account level. ${books.length} books: ${list}. Total royalty earned Rs ${sum('royaltyEarned')}, paid Rs ${sum('royaltyPaid')}, pending Rs ${sum('royaltyPending')}.`,
  };
}

async function generateDraft(ticketId) {
  const ticket = await Ticket.findById(ticketId).populate('author', 'name');
  if (!ticket) return null;

  const book = await loadBookContext(ticket);
  // Only the last 3 messages, not the whole history (token control).
  const replies = ticket.replies.slice(-3).map((r) => ({ role: r.senderRole, body: r.body }));

  const now = new Date();
  const text = await ai.complete({
    system: draftSystem(ticket.category || 'General Inquiry'),
    user: draftUser({
      ticket,
      authorName: ticket.author.name,
      book,
      replies,
      today: now.toISOString().slice(0, 10),
      payoutDate: nextPayoutDeadline(now).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    }),
    maxTokens: 500,
  });

  const draft = text.trim();
  await Ticket.updateOne({ _id: ticketId }, { $set: { aiDraft: draft } });
  return draft;
}

// Reuse the saved draft unless the admin explicitly asks for a new one (saves money).
async function getOrCreateDraft(ticketId, { regenerate = false } = {}) {
  if (!regenerate) {
    const saved = await Ticket.findById(ticketId).select('aiDraft');
    if (saved && saved.aiDraft) return saved.aiDraft;
  }
  return generateDraft(ticketId);
}

module.exports = { getOrCreateDraft };