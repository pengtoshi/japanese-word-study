export function formatDateTimeKo(date: string | number | Date) {
  return new Date(date).toLocaleString("ko-KR");
}

export function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
