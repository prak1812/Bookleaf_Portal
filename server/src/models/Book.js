const { Schema, model } = require('mongoose');
const { toJSON } = require('./shared');

const bookSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  isbn: { type: String, default: null },
  genre: { type: String, default: null },
  publicationDate: { type: Date, default: null },
  status: { type: String, required: true },
  mrp: { type: Number, default: 0 },
  copiesSold: { type: Number, default: 0 },
  royaltyEarned: { type: Number, default: 0 },
  royaltyPaid: { type: Number, default: 0 },
  royaltyPending: { type: Number, default: 0 },
}, { timestamps: true, toJSON });

module.exports = model('Book', bookSchema);