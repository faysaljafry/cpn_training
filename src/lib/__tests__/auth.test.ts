// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockSet = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    set: mockSet,
    get: vi.fn(),
    delete: vi.fn(),
  }),
}));

import { createSession } from "../auth";

beforeEach(() => {
  mockSet.mockClear();
});

test("createSession sets the auth-token cookie", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockSet).toHaveBeenCalledOnce();
  expect(mockSet.mock.calls[0][0]).toBe("auth-token");
});

test("createSession token is a valid JWT containing userId and email", async () => {
  await createSession("user-123", "test@example.com");

  const token: string = mockSet.mock.calls[0][1];
  const secret = new TextEncoder().encode("development-secret-key");
  const { payload } = await jwtVerify(token, secret);

  expect(payload.userId).toBe("user-123");
  expect(payload.email).toBe("test@example.com");
});

test("createSession token uses HS256 algorithm", async () => {
  await createSession("user-123", "test@example.com");

  const token: string = mockSet.mock.calls[0][1];
  const header = JSON.parse(atob(token.split(".")[0]));

  expect(header.alg).toBe("HS256");
});

test("createSession sets httpOnly, sameSite lax, path /", async () => {
  await createSession("user-123", "test@example.com");

  const options = mockSet.mock.calls[0][2];

  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession sets secure:false outside production", async () => {
  await createSession("user-123", "test@example.com");

  const options = mockSet.mock.calls[0][2];

  expect(options.secure).toBe(false);
});

test("createSession cookie expires approximately 7 days from now", async () => {
  const before = Date.now();
  await createSession("user-123", "test@example.com");
  const after = Date.now();

  const options = mockSet.mock.calls[0][2];
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(options.expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});
