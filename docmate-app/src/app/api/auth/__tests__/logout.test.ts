import { describe, it, expect, vi } from "vitest";

const mockRemoveAuthCookie = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/auth", () => ({
  removeAuthCookie: (...args: unknown[]) => mockRemoveAuthCookie(...args),
}));

import { POST } from "@/app/api/auth/logout/route";

describe("POST /api/auth/logout", () => {
  it("should call removeAuthCookie", async () => {
    await POST();
    expect(mockRemoveAuthCookie).toHaveBeenCalled();
  });

  it("should return 200 with success message", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBe("Успешно излязохте от профила.");
  });
});
