import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/mongodb", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

const mockSetAuthCookie = vi.fn().mockResolvedValue(undefined);
const mockComparePassword = vi.fn();

vi.mock("@/lib/auth", () => ({
  comparePassword: (...args: unknown[]) => mockComparePassword(...args),
  setAuthCookie: (...args: unknown[]) => mockSetAuthCookie(...args),
}));

const mockUserFindOne = vi.fn();

vi.mock("@/models/User", () => ({
  User: {
    findOne: (...args: unknown[]) => mockUserFindOne(...args),
  },
}));

import { POST } from "@/app/api/auth/login/route";

function createRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL("http://localhost:3000/api/auth/login"), {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/login", () => {
  it("should return 400 when email is missing", async () => {
    const res = await POST(createRequest({ password: "123456" }));
    expect(res.status).toBe(400);
  });

  it("should return 400 when password is missing", async () => {
    const res = await POST(createRequest({ email: "t@t.com" }));
    expect(res.status).toBe(400);
  });

  it("should return 401 when user is not found", async () => {
    mockUserFindOne.mockResolvedValue(null);
    const res = await POST(createRequest({ email: "t@t.com", password: "123456" }));
    expect(res.status).toBe(401);
  });

  it("should return 401 when password is incorrect", async () => {
    mockUserFindOne.mockResolvedValue({
      _id: "id1",
      email: "t@t.com",
      password: "hashed",
      name: "Test",
      role: "patient",
    });
    mockComparePassword.mockResolvedValue(false);
    const res = await POST(createRequest({ email: "t@t.com", password: "wrong" }));
    expect(res.status).toBe(401);
  });

  it("should return 200 with user data on successful login", async () => {
    mockUserFindOne.mockResolvedValue({
      _id: "id1",
      email: "t@t.com",
      password: "hashed",
      name: "Test User",
      role: "patient",
    });
    mockComparePassword.mockResolvedValue(true);

    const res = await POST(createRequest({ email: "t@t.com", password: "correct" }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user.email).toBe("t@t.com");
    expect(data.user.name).toBe("Test User");
    expect(mockSetAuthCookie).toHaveBeenCalledWith({
      userId: "id1",
      email: "t@t.com",
      role: "patient",
    });
  });

  it("should return 500 on unexpected error", async () => {
    mockUserFindOne.mockRejectedValue(new Error("DB error"));
    const res = await POST(createRequest({ email: "t@t.com", password: "123456" }));
    expect(res.status).toBe(500);
  });
});
