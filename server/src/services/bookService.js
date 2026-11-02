const Book = require('../models/Book');

async function listBooks(user) {
  // Authors only get their own books. The filter comes from the verified token, never from the request.
  const filter = user.role === 'admin' ? {} : { author: user.id };
  const query = Book.find(filter).sort({ publicationDate: -1, title: 1 }); // unpublished (null) sort last
  if (user.role === 'admin') query.populate('author', 'name');
  return query.exec();
}

module.exports = { listBooks };