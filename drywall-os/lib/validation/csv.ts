const csvDangerPrefix = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: unknown) {
  const raw = value == null ? "" : String(value);
  const neutralized = csvDangerPrefix.test(raw) ? `'${raw}` : raw;
  return `"${neutralized.replace(/"/g, '""')}"`;
}

export function toCsv(rows: unknown[][]) {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}
