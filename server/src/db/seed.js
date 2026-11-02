const bcrypt = require('bcryptjs');
const { connect, mongoose } = require('../config/db');
const User = require('../models/User');
const Book = require('../models/Book');
const Ticket = require('../models/Ticket');
const data = require('./sample/bookleaf_sample_data.json');

const AUTHOR_PASSWORD = 'Author@123';
const ADMIN_PASSWORD = 'Admin@123';

const mapBook = (b) => ({
  title: b.title,
  isbn: b.isbn || null,
  genre: b.genre || null,
  publicationDate: b.publication_date || null,
  status: b.status,
  mrp: b.mrp ?? 0,
  copiesSold: b.total_copies_sold ?? 0,
  royaltyEarned: b.total_royalty_earned ?? 0,
  royaltyPaid: b.royalty_paid ?? 0,
  royaltyPending: b.royalty_pending ?? 0,
});

async function main() {
  await connect();

  await Promise.all([User.deleteMany({}), Book.deleteMany({}), Ticket.deleteMany({})]);

  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const authorHash = await bcrypt.hash(AUTHOR_PASSWORD, 10);

  await User.create([
    { name: 'Asha (BookLeaf Ops)', email: 'admin1@bookleaf.test', passwordHash: adminHash, role: 'admin' },
    { name: 'Ravi (BookLeaf Ops)', email: 'admin2@bookleaf.test', passwordHash: adminHash, role: 'admin' },
  ]);

  // Each author has their own nested books array.
  for (const a of data.authors) {
    const author = await User.create({
      name: a.name,
      email: a.email,
      passwordHash: authorHash,
      role: 'author',
    });
    for (const b of a.books || []) {
      await Book.create({ author: author._id, ...mapBook(b) });
    }
  }

  console.log('Seeded successfully.');
  console.log('Admin login: admin1@bookleaf.test / ' + ADMIN_PASSWORD);
  console.log('Author logins: any author email / ' + AUTHOR_PASSWORD);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});