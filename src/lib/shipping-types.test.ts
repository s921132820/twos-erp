import { describe, expect, test } from "bun:test";

import { getFreightGrade, parsePastedText } from "./shipping-types";

describe("shipping-types", () => {
  test("getFreightGrade returns correct grade by weight", () => {
    expect(getFreightGrade(5)).toBe("A");
    expect(getFreightGrade(12)).toBe("C");
    expect(getFreightGrade(18)).toBe("D");
    expect(getFreightGrade(25)).toBe("E");
  });

  test("parsePastedText parses labeled lines", () => {
    const result = parsePastedText("수화인명: 홍길동\n우편번호: 06236");
    expect(result.recipientName).toBe("홍길동");
    expect(result.zipCode).toBe("06236");
  });
});
