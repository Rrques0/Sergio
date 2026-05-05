import { describe, expect, it } from "vitest";

describe("estimate money math", () => {
  it("calculates markup, tax, and deposit in cents", () => {
    const subtotalCents = 150000;
    const markupCents = Math.round(subtotalCents * 0.1);
    const taxCents = Math.round((subtotalCents + markupCents) * 0.0825);
    const totalCents = subtotalCents + markupCents + taxCents;
    const depositRequiredCents = Math.round(totalCents * 0.3);

    expect(markupCents).toBe(15000);
    expect(taxCents).toBe(13613);
    expect(totalCents).toBe(178613);
    expect(depositRequiredCents).toBe(53584);
  });
});
