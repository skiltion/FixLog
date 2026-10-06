export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function truncate(value: string, length = 150) {
  if (value.length <= length) return value;
  return `${value.slice(0, length).trimEnd()}…`;
}
