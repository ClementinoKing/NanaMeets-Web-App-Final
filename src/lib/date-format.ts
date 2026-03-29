const UTC_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  hour12: false,
  timeZone: "UTC",
});

export function formatUtcDateTime(value: string) {
  return UTC_DATE_TIME_FORMATTER.format(new Date(value));
}
