export function blogCreatedDate(value) {
  if (value == null || value === '') return null;
  const seconds = typeof value === 'object' ? value.seconds ?? value._seconds : null;
  const date = new Date(seconds == null ? value : seconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}
