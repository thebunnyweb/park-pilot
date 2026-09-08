import { beforeAll, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "./crypto";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-at-least-16-chars-long";
});

describe("secret encryption", () => {
  it("round-trips a value", () => {
    const key = "sk-ant-abc123_XYZ-456";
    const enc = encryptSecret(key);
    expect(enc).not.toContain(key);
    expect(enc.split(".")).toHaveLength(4);
    expect(decryptSecret(enc)).toBe(key);
  });

  it("produces different ciphertext each time (random salt/iv)", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("returns null on tampered ciphertext", () => {
    const enc = encryptSecret("value");
    const parts = enc.split(".");
    parts[3] = Buffer.from("tampered").toString("base64");
    expect(decryptSecret(parts.join("."))).toBeNull();
  });

  it("returns null on garbage input", () => {
    expect(decryptSecret("not-valid")).toBeNull();
  });
});
