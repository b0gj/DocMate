import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongodb", () => ({
    connectDB: vi.fn().mockResolvedValue(undefined),
}));

const mockGetAuthUser = vi.fn();

vi.mock("@/lib/auth", () => ({
    getAuthUser: (...args: unknown[]) => mockGetAuthUser(...args),
}));

function createChainableMock(resolvedValue: unknown) {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.populate = vi.fn().mockReturnValue(chain);
    chain.lean = vi.fn().mockResolvedValue(resolvedValue);
    return chain;
}

const mockFindById = vi.fn();
const mockFindByIdAndUpdate = vi.fn();

vi.mock("@/models/User", () => ({
    User: {
        findById: (...args: unknown[]) => mockFindById(...args),
        findByIdAndUpdate: (...args: unknown[]) =>
            mockFindByIdAndUpdate(...args),
    },
}));

import { GET, PUT } from "@/app/api/auth/me/route";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("GET /api/auth/me", () => {
    it("should return 401 when not authenticated", async () => {
        mockGetAuthUser.mockResolvedValue(null);
        const res = await GET();
        expect(res.status).toBe(401);
    });

    it("should return 404 when user not found", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: "id1",
            email: "t@t.com",
            role: "patient",
        });
        mockFindById.mockReturnValue(createChainableMock(null));
        const res = await GET();
        expect(res.status).toBe(404);
    });

    it("should return 200 with user data", async () => {
        const userData = {
            _id: "id1",
            email: "t@t.com",
            name: "Test",
            role: "patient",
        };
        mockGetAuthUser.mockResolvedValue({
            userId: "id1",
            email: "t@t.com",
            role: "patient",
        });
        mockFindById.mockReturnValue(createChainableMock(userData));

        const res = await GET();
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.user.email).toBe("t@t.com");
        expect(data.user.name).toBe("Test");
    });

    it("should call select to exclude password", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: "id1",
            email: "t@t.com",
            role: "patient",
        });
        const chain = createChainableMock({ _id: "id1" });
        mockFindById.mockReturnValue(chain);
        await GET();
        expect(chain.select).toHaveBeenCalledWith("-password");
    });

    it("should populate doctorProfile", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: "id1",
            email: "t@t.com",
            role: "doctor",
        });
        const chain = createChainableMock({ _id: "id1", doctorProfile: {} });
        mockFindById.mockReturnValue(chain);
        await GET();
        expect(chain.populate).toHaveBeenCalledWith("doctorProfile");
    });

    it("should return 500 on unexpected error", async () => {
        mockGetAuthUser.mockRejectedValue(new Error("fail"));
        const res = await GET();
        expect(res.status).toBe(500);
    });
});

describe("PUT /api/auth/me", () => {
    function createPutRequest(body: Record<string, unknown>) {
        return new Request("http://localhost:3000/api/auth/me", {
            method: "PUT",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        });
    }

    it("should return 401 when not authenticated", async () => {
        mockGetAuthUser.mockResolvedValue(null);
        const res = await PUT(createPutRequest({ name: "New" }));
        expect(res.status).toBe(401);
    });

    it("should return 404 when user not found", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: "id1",
            email: "t@t.com",
            role: "patient",
        });
        mockFindByIdAndUpdate.mockReturnValue(createChainableMock(null));
        const res = await PUT(createPutRequest({ name: "New" }));
        expect(res.status).toBe(404);
    });

    it("should return 200 with updated user data", async () => {
        const updatedUser = {
            _id: "id1",
            name: "Updated",
            phone: "0888",
            city: "Варна",
        };
        mockGetAuthUser.mockResolvedValue({
            userId: "id1",
            email: "t@t.com",
            role: "patient",
        });
        mockFindByIdAndUpdate.mockReturnValue(createChainableMock(updatedUser));

        const res = await PUT(
            createPutRequest({ name: "Updated", phone: "0888", city: "Варна" }),
        );
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.user.name).toBe("Updated");
    });

    it("should return 500 on unexpected error", async () => {
        mockGetAuthUser.mockRejectedValue(new Error("fail"));
        const res = await PUT(createPutRequest({ name: "New" }));
        expect(res.status).toBe(500);
    });
});
