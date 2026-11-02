export const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
export const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
export const CATEGORIES = [
  'Royalty & Payments', 'ISBN & Metadata Issues', 'Printing & Quality',
  'Distribution & Availability', 'Book Status & Production Updates', 'General Inquiry',
];
export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');