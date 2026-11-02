const express = require('express');
const { z } = require('zod');
const { requireAuth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const parseId = require('../utils/parseId');
const { CATEGORIES, PRIORITIES, STATUSES } = require('../utils/constants');
const tickets = require('../services/ticketService');
const { classifyTicket } = require('../ai/classifier');   
 const { getOrCreateDraft } = require('../ai/drafter');    
 const HttpError = require('../utils/httpError');
const { AiUnavailableError } = require('../ai/client');


const router = express.Router();
router.use(requireAuth);

const createSchema = z.object({
  bookId: z.string().regex(/^[0-9a-fA-F]{24}$/).nullable().optional(),
  subject: z.string().trim().min(3).max(150),
  description: z.string().trim().min(10).max(5000),
});

const listQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  category: z.enum(CATEGORIES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigned: z.enum(['me', 'unassigned']).optional(),
  from: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/).optional(),
  to: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/).optional(),
});

const updateSchema = z.object({
  status: z.enum(STATUSES).optional(),
  category: z.enum(CATEGORIES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assignedTo: z.literal('me').nullable().optional(), // 'me' = assign to myself, null = unassign
}).refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update' });

const textSchema = z.object({ body: z.string().trim().min(1).max(5000) });

router.post('/', requireRole('author'), validate(createSchema), asyncHandler(async (req, res) => {
  const ticket = await tickets.createTicket(req.user.id, req.body);
  res.status(201).json({ ticket });
   setImmediate(() => classifyTicket(ticket.id).catch((e) => console.error('[ai] classify crashed', e)));
}));

router.get('/', validate(listQuerySchema, 'query'), asyncHandler(async (req, res) => {
  res.json({ tickets: await tickets.listTickets(req.user, req.query) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  res.json({ ticket: await tickets.getTicket(req.user, parseId(req.params.id)) });
}));

router.patch('/:id', requireRole('admin'), validate(updateSchema), asyncHandler(async (req, res) => {
  res.json({ ticket: await tickets.updateTicket(req.user, parseId(req.params.id), req.body) });
}));

router.post('/:id/replies', requireRole('admin'), validate(textSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ ticket: await tickets.addReply(req.user, parseId(req.params.id), req.body.body) });
}));

router.post('/:id/notes', requireRole('admin'), validate(textSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ ticket: await tickets.addNote(req.user, parseId(req.params.id), req.body.body) });
}));

router.post('/:id/draft', requireRole('admin'), asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  await tickets.getTicket(req.user, id); // 404 if the ticket does not exist
  try {
    const draft = await getOrCreateDraft(id, { regenerate: req.query.regenerate === 'true' });
    res.json({ draft });
  } catch (err) {
    if (err instanceof AiUnavailableError) {
      throw new HttpError(503, 'AI_UNAVAILABLE', 'AI drafting is unavailable right now. You can write the reply manually.');
    }
    throw err;
  }
}));



module.exports = router;