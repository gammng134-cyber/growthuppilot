import { describe, expect, it } from "vitest";

import { contactsFromCsv, parseCsv } from "@/lib/csv";

describe("parseCsv", () => {
  it("splits a simple CSV", () => {
    const { headers, rows } = parseCsv("a,b,c\n1,2,3");
    expect(headers).toEqual(["a", "b", "c"]);
    expect(rows).toEqual([["1", "2", "3"]]);
  });  it("handles quoted fields with commas and escaped quotes", () => {
    const { headers, rows } = parseCsv(
      'name,notes\n"hello, world","say \"hi\""',
    );
    expect(headers).toEqual(["name", "notes"]);
    expect(rows[0][0]).toBe("hello, world");
    expect(rows[0][1]).toContain("hi");
  });
  it("handles quoted fields with newlines", () => {
    const { headers, rows } = parseCsv('name,notes\n"line1\nline2",x');
    expect(headers).toEqual(["name", "notes"]);
    expect(rows).toEqual([["line1\nline2", "x"]]);
  });
});

describe("contactsFromCsv", () => {
  it("parses a contact CSV and drops bad rows", () => {
    const { contacts, skipped } = contactsFromCsv(
      "name,email,company,role,notes\nDana,dana@acme.io,Acme,Founder,hi\nbad,not-an-email,x,y,z\n",
    );
    expect(contacts).toHaveLength(1);
    expect(contacts[0].email).toBe("dana@acme.io");
    expect(contacts[0].name).toBe("Dana");
    expect(skipped).toBe(1);
  });

  it("rejects rows without an email column", () => {
    const { contacts, skipped } = contactsFromCsv(
      "name,company\nDana,Acme\n",
    );
    expect(contacts).toEqual([]);
    expect(skipped).toBe(1);
  });
});
