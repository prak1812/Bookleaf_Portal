const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// Royalties are paid within 45 days after each quarter ends.
function nextPayoutDeadline(today = new Date()) {
  const q = Math.floor(today.getMonth() / 3);
  const lastQuarterEnd = new Date(today.getFullYear(), q * 3, 0);   // day before this quarter began
  const lastDeadline = addDays(lastQuarterEnd, 45);
  if (lastDeadline >= today) return lastDeadline;                    // last quarter's payout still pending
  return addDays(new Date(today.getFullYear(), q * 3 + 3, 0), 45);  // otherwise this quarter's
}

module.exports = { nextPayoutDeadline };