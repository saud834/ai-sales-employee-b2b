import { describe, expect, it } from "vitest";
import { isAuthorized } from "../src/auth";
import type { Env } from "../src/types";

function envWith(token: string): Env {
  return { API_AUTH_TOKEN: token } as Env;
}

describe("isAuthorized", () => {
  it("rejects requests with no Authorization header", () => {
    const req = new Request("https://example.com/files");
    expect(isAuthorized(req, envWith("secret"))).toBe(false);
  });

  it("rejects a wrong bearer token", () => {
    const req = new Request("https://example.com/files", { headers: { Authorization: "Bearer wrong" } });
    expect(isAuthorized(req, envWith("secret"))).toBe(false);
  });

  it("rejects a non-Bearer scheme", () => {
    const req = new Request("https://example.com/files", { headers: { Authorization: "Basic secret" } });
    expect(isAuthorized(req, envWith("secret"))).toBe(false);
  });

  it("accepts the correct bearer token", () => {
    const req = new Request("https://example.com/files", { headers: { Authorization: "Bearer secret" } });
    expect(isAuthorized(req, envWith("secret"))).toBe(true);
  });

  it("rejects everything when API_AUTH_TOKEN is unset", () => {
    const req = new Request("https://example.com/files", { headers: { Authorization: "Bearer anything" } });
    expect(isAuthorized(req, envWith(""))).toBe(false);
  });
});
