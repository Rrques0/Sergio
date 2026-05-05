import { describe, expect, it } from "vitest";

import { escapeCsvCell, toCsv } from "@/lib/validation/csv";

describe("CSV export safety", () => {
  it("neutralizes spreadsheet formula injection prefixes", () => {
    expect(escapeCsvCell("=cmd|calc")).toBe("\"'=cmd|calc\"");
    expect(escapeCsvCell("+SUM(A1:A2)")).toBe("\"'+SUM(A1:A2)\"");
    expect(escapeCsvCell("-10")).toBe("\"'-10\"");
    expect(escapeCsvCell("@user")).toBe("\"'@user\"");
  });

  it("quotes rows consistently", () => {
    expect(toCsv([["Vendor", "Amount"], ["Drywall Supply", "100.00"]])).toBe(
      "\"Vendor\",\"Amount\"\r\n\"Drywall Supply\",\"100.00\""
    );
  });
});
