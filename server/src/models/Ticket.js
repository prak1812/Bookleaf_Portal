const { Schema, model } = require('mongoose');
const { CATEGORIES, PRIORITIES, STATUSES } = require('../utils/constants');
const { toJSON } = require('./shared');

const SOURCES = ['pending', 'ai', 'rules', 'admin'];
const createdOnly = { createdAt: true, updatedAt: false };

// Embedded inside a ticket. The author can see replies.
const replySchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, enum: ['author', 'admin'], required: true },
  body: { type: String, required: true },
}, { timestamps: createdOnly, toJSON });

// Embedded inside a ticket. Admin-only: never sent to authors.
const noteSchema = new Schema({
  admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  adminName: { type: String, required: true },
  body: { type: String, required: true },
}, { timestamps: createdOnly, toJSON });

const ticketSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  book: { type: Schema.Types.ObjectId, ref: 'Book', default: null },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  status: { type: String, enum: STATUSES, default: 'Open' },
  // category and priority stay unset until the AI (or the keyword fallback) fills them in
  category: { type: String, enum: CATEGORIES },
  categorySource: { type: String, enum: SOURCES, default: 'pending' },
  priority: { type: String, enum: PRIORITIES },
  prioritySource: { type: String, enum: SOURCES, default: 'pending' },
  aiReasoning: String,
  aiDraft: String,
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  replyCount: { type: Number, default: 0 },
  replies: [replySchema],
  notes: [noteSchema],
}, { timestamps: true, toJSON });

ticketSchema.index({ status: 1, createdAt: 1 });

module.exports = model('Ticket', ticketSchema);