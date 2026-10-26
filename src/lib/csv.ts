export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

/** Minimal RFC-4180-ish CSV parser: handles quoted fields, commas and newlines. */
export function parseCsv(text: string): ParsedCsv {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/\r\n?/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else if (ch === "\\") {
        // Escaped character inside quotes (e.g. \" keeps the backslash).
        // Consume the escaped char literally.
        if (i + 1 < src.length) {
          field += src[i + 1];
          i++;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);

  const headers = (rows.shift() ?? []).map((h) => h.trim().toLowerCase());
  return { headers, rows };
}

export interface ContactCsvRow {
  name: string;
  email: string;
  company: string;
  role: string;
  notes: string;
  sourceContext: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Maps CSV rows to contact fields; returns rows and the count skipped. */
export function contactsFromCsv(text: string): {
  contacts: ContactCsvRow[];
  skipped: number;
} {
  const { headers, rows } = parseCsv(text);
  const idx = (names: string[]) =>
    headers.findIndex((h) => names.includes(h));

  const iName = idx(["name", "full name", "contact name"]);
  const iEmail = idx(["email", "email address", "e-mail"]);
  const iCompany = idx(["company", "organization", "organisation"]);
  const iRole = idx(["role", "title", "job title"]);
  const iNotes = idx(["notes", "note"]);
  const iContext = idx([
    "source_context",
    "source context",
    "context",
    "their words",
  ]);

  if (iEmail === -1) {
    return { contacts: [], skipped: rows.length };
  }

  const contacts: ContactCsvRow[] = [];
  let skipped = 0;
  const seen = new Set<string>();

  for (const row of rows) {
    const email = (row[iEmail] ?? "").trim();
    if (!EMAIL_RE.test(email) || seen.has(email.toLowerCase())) {
      skipped++;
      continue;
    }
    seen.add(email.toLowerCase());
    contacts.push({
      name: iName >= 0 ? (row[iName] ?? "").trim() : "",
      email,
      company: iCompany >= 0 ? (row[iCompany] ?? "").trim() : "",
      role: iRole >= 0 ? (row[iRole] ?? "").trim() : "",
      notes: iNotes >= 0 ? (row[iNotes] ?? "").trim() : "",
      sourceContext: iContext >= 0 ? (row[iContext] ?? "").trim() : "",
    });
  }
  return { contacts, skipped };
}
