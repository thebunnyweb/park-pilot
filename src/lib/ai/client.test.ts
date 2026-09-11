import { describe, expect, it } from "vitest";
import { parseMaxTokensCap } from "./client";

describe("parseMaxTokensCap", () => {
  it("extracts the cap from Groq's real rejection message", () => {
    const msg =
      "400 `max_tokens` must be less than or equal to `8192`, the maximum value for " +
      "`max_tokens` is less than the `context_window` for this model";
    expect(parseMaxTokensCap(msg)).toBe(8192);
  });

  it("extracts the cap from a differently-worded message", () => {
    expect(parseMaxTokensCap("Error: max_tokens exceeds the limit of 4096 for this model")).toBe(
      4096,
    );
  });

  it("ignores a leading HTTP status code and finds the real cap", () => {
    expect(parseMaxTokensCap("429 max_tokens must not exceed 2048")).toBe(2048);
  });

  it("returns null for unrelated errors instead of matching a random number", () => {
    expect(parseMaxTokensCap("401 Invalid API Key")).toBeNull();
    expect(parseMaxTokensCap("Rate limit: retry after 30 seconds")).toBeNull();
  });
});
