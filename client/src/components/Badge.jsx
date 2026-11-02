export default function Badge({ value }) {
  if (!value) return null;
  const cls = String(value).toLowerCase().split(' ').join('-');
  return <span className={`badge ${cls}`}>{value}</span>;
}