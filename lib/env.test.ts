import { API_BASE } from "./env";

describe("API_BASE", () => {
  it("returns a non-empty string", () => {
    expect(typeof API_BASE).toBe("string");
    expect(API_BASE.length).toBeGreaterThan(0);
  });
});
