export function toDateInputValue(value) {
  if (!value) return "";

  // API date fields are serialized as ISO timestamps, while <input type="date">
  // only accepts the YYYY-MM-DD portion.
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}
