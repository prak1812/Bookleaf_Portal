const Ticket = require('../models/Ticket');
const ai = require('./client');
const { CATEGORIES, PRIORITIES } = require('../utils/constants');
const { classifySystem, classifyUser } = require('./prompts');

// Fallback used when the AI is down. Crude on purpose: better than leaving tickets unsorted.
const RULES = [
  ['ISBN & Metadata Issues', ['isbn', 'metadata', 'barcode']],
  ['Royalty & Payments', ['royalty', 'payment', 'payout', 'paid', 'bank']],
  ['Printing & Quality', ['print', 'blurry', 'binding', 'misprint', 'quality', 'reprint']],
  ['Distribution & Availability', ['unavailable', 'amazon', 'flipkart', 'listing', 'out of stock']],
  ['Book Status & Production Updates', ['typesetting', 'proof', 'cover design', 'status', 'when will', 'production']],
];

function ruleBased(text) {
  const t = text.toLowerCase();
  for (const [category, words] of RULES) {
    if (words.some((w) => t.includes(w))) {
      return { category, priority: category === 'ISBN & Metadata Issues' ? 'High' : 'Medium', reason: 'Keyword rules (AI unavailable)' };
    }
  }
  return { category: 'General Inquiry', priority: 'Medium', reason: 'Keyword rules (AI unavailable)' };
}

// Never trust model output: pull the JSON out and check it against the allowed lists.
function parseAiResult(raw) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON in AI reply');
  const data = JSON.parse(raw.slice(start, end + 1));
  if (!CATEGORIES.includes(data.category)) throw new Error('Invalid category from AI');
  if (!PRIORITIES.includes(data.priority)) throw new Error('Invalid priority from AI');
  return { category: data.category, priority: data.priority, reason: String(data.reason || '').slice(0, 200) };
}

async function classifyTicket(ticketId) {
  const ticket = await Ticket.findById(ticketId).select('subject description');
  if (!ticket) return;

  let result;
  let source;
  try {
    // Small call: no knowledge base, no history, tiny output.
    const raw = await ai.complete({ system: classifySystem, user: classifyUser(ticket), maxTokens: 150 });
    result = parseAiResult(raw);
    source = 'ai';
  } catch (err) {
    console.warn(`[ai] classify failed for ticket ${ticketId}: ${err.message}`);
    result = ruleBased(`${ticket.subject} ${ticket.description}`);
    source = 'rules';
  }

  // Conditional updates: a field is only filled while it is still 'pending'. If an admin
  // overrode it while the AI was thinking, the admin's choice stays.
  await Ticket.updateOne({ _id: ticketId, categorySource: 'pending' },
    { $set: { category: result.category, categorySource: source } });
  await Ticket.updateOne({ _id: ticketId, prioritySource: 'pending' },
    { $set: { priority: result.priority, prioritySource: source } });
  await Ticket.updateOne({ _id: ticketId }, { $set: { aiReasoning: result.reason } });
}

module.exports = { classifyTicket };