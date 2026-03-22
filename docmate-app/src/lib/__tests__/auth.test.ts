import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Use vi.hoisted so the variable is available when vi.mock is hoisted
const { mockCookieStore } = vi.hoisted(() => ({
  mockCookieStore: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

import {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  setAuthCookie,
  removeAuthCookie,
  getAuthUser,
  type JwtPayload,
} from "@/lib/auth";

const testPayload: JwtPayload = {
  userId: "user123",
  email: "test@example.com",
  role: "patient",
};

beforeEach(() => {
  mockCookieStore.get.mockReset();
  mockCookieStore.set.mockReset();
  mockCookieStore.delete.mockReset();
});

describe("hashPassword", () => {
  it("should return a bcrypt hash different from the original password", async () => {
    const hash = await hashPassword("mypassword");
    expect(hash).not.toBe("mypassword");
    expect(hash).toMatch(/^\$2[aby]?\$/);
  });

  it("should produce different hashes for the same password", async () => {
    const hash1 = await hashPassword("mypassword");
    const hash2 = await hashPassword("mypassword");
    expect(hash1).not.toBe(hash2);
  });

  it("should produce a hash verifiable with bcrypt.compare", async () => {
    const hash = await hashPassword("mypassword");
    const isValid = await bcrypt.compare("mypassword", hash);
    expect(isValid).toBe(true);
  });
});

describe("comparePassword", () => {
  it("should return true for matching password and hash", async () => {
    const hash = await bcrypt.hash("correct", 12);
    expect(await comparePassword("correct", hash)).toBe(true);
  });

  it("should return false for non-matching password", async () => {
    const hash = await bcrypt.hash("correct", 12);
    expect(await comparePassword("wrong", hash)).toBe(false);
  });

  it("should return false for empty password against a hash", async () => {
    const hash = await bcrypt.hash("correct", 12);
    expect(await comparePassword("", hash)).toBe(false);
  });
});

describe("signToken", () => {
  it("should return a string JWT", () => {
    const token = signToken(testPayload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("should embed userId, email, role in the token payload", () => {
    const token = signToken(testPayload);
    const decoded = jwt.decode(token) as Record<string, unknown>;
    expect(decoded.userId).toBe("user123");
    expect(decoded.email).toBe("test@example.com");
    expect(decoded.role).toBe("patient");
  });

  it("should set expiry to 7 days", () => {
    const token = signToken(testPayload);
    const decoded = jwt.decode(token) as { iat: number; exp: number };
    const diff = decoded.exp - decoded.iat;
    expect(diff).toBe(7 * 24 * 60 * 60);
  });
});

describe("verifyToken", () => {
  it("should return payload for a valid token", () => {
    const token = signToken(testPayload);
    const result = verifyToken(token);
    expect(result).not.toBeNull();
    expect(result!.userId).toBe("user123");
    expect(result!.email).toBe("test@example.com");
    expect(result!.role).toBe("patient");
  });

  it("should return null for a tampered token", () => {
    const token = signToken(testPayload);
    const tampered = token.slice(0, -5) + "XXXXX";
    expect(verifyToken(tampered)).toBeNull();
  });

  it("should return null for a completely invalid string", () => {
    expect(verifyToken("not-a-token")).toBeNull();
  });

  it("should return null for empty string", () => {
    expect(verifyToken("")).toBeNull();
  });
});

describe("setAuthCookie", () => {
  it("should call cookies().set with correct name and options", async () => {
    await setAuthCookie(testPayload);
    expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
    const [name, _token, options] = mockCookieStore.set.mock.calls[0];
    expect(name).toBe("docmate-token");
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.maxAge).toBe(60 * 60 * 24 * 7);
    expect(options.path).toBe("/");
  });

  it("should set a valid JWT as the cookie value", async () => {
    await setAuthCookie(testPayload);
    const token = mockCookieStore.set.mock.calls[0][1];
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe("user123");
  });
});

describe("removeAuthCookie", () => {
  it("should call cookies().delete with docmate-token", async () => {
    await removeAuthCookie();
    expect(mockCookieStore.delete).toHaveBeenCalledWith("docmate-token");
  });
});

describe("getAuthUser", () => {
  it("should return null when no cookie exists", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await getAuthUser();
    expect(result).toBeNull();
  });

  it("should return payload when valid cookie exists", async () => {
    const token = signToken(testPayload);
    mockCookieStore.get.mockReturnValue({ value: token });
    const result = await getAuthUser();
    expect(result).not.toBeNull();
    expect(result!.userId).toBe("user123");
    expect(result!.email).toBe("test@example.com");
  });

  it("should return null when cookie has invalid token", async () => {
    mockCookieStore.get.mockReturnValue({ value: "invalid-token" });
    const result = await getAuthUser();
    expect(result).toBeNull();
  });
});
