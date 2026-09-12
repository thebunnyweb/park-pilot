import { describe, expect, it } from "vitest";
import { extractJson, parseMaxTokensCap } from "./client";

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

describe("extractJson", () => {
  it("parses a bare JSON object", () => {
    expect(extractJson<{ ok: boolean }>('{"ok": true}')).toEqual({ ok: true });
  });

  it("parses JSON wrapped in a markdown fence", () => {
    expect(extractJson<{ ok: boolean }>('Here you go:\n```json\n{"ok": true}\n```\nEnjoy!')).toEqual(
      { ok: true },
    );
  });

  it("throws a specific, non-empty message with the model's own text when there's no JSON at all", () => {
    expect(() => extractJson("Sorry, I can't help with that today.")).toThrowError(
      /did not return JSON[\s\S]*Sorry, I can't help with that today/,
    );
  });

  it("mentions a non-\"stop\" finish_reason when present, since that's usually the real cause", () => {
    expect(() => extractJson("I need to search for", "tool_calls")).toThrowError(/tool_calls/);
  });

  it("gives a distinct message for a genuinely empty response", () => {
    expect(() => extractJson("   ")).toThrowError(/empty response/i);
  });

  it("reports malformed (truncated) JSON separately from missing JSON", () => {
    expect(() => extractJson('{"blocks": [1, 2,]}')).toThrowError(/malformed/i);
  });
});
