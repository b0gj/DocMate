import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/mongodb", () => ({
    connectDB: vi.fn().mockResolvedValue(undefined),
}));

const mockGetAuthUser = vi.fn();

vi.mock("@/lib/auth", () => ({
    getAuthUser: (...args: unknown[]) => mockGetAuthUser(...args),
}));

const mockSlotFindOneAndUpdate = vi.fn();

vi.mock("@/models/Slot", () => ({
    Slot: {
        findOneAndUpdate: (...args: unknown[]) =>
            mockSlotFindOneAndUpdate(...args),
    },
}));

const mockBookingCreate = vi.fn();
const mockBookingFind = vi.fn();

vi.mock("@/models/Booking", () => ({
    Booking: {
        create: (...args: unknown[]) => mockBookingCreate(...args),
        find: (...args: unknown[]) => mockBookingFind(...args),
    },
}));

function createFindChain(resolvedValue: unknown) {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    chain.populate = vi.fn().mockReturnValue(chain);
    chain.sort = vi.fn().mockReturnValue(chain);
    chain.lean = vi.fn().mockResolvedValue(resolvedValue);
    return chain;
}

function createLeanChain(resolvedValue: unknown) {
    return { lean: vi.fn().mockResolvedValue(resolvedValue) };
}

const mockUserFindById = vi.fn();

vi.mock("@/models/User", () => ({
    User: {
        findById: (...args: unknown[]) => mockUserFindById(...args),
    },
}));

import { POST, GET } from "@/app/api/bookings/route";

function createPostRequest(body: Record<string, unknown>) {
    return new NextRequest(new URL("http://localhost:3000/api/bookings"), {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
    });
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("POST /api/bookings", () => {
    it("should return 401 when not authenticated", async () => {
        mockGetAuthUser.mockResolvedValue(null);
        const res = await POST(createPostRequest({ slotId: "s1" }));
        expect(res.status).toBe(401);
    });

    it("should return 403 when user is not a patient", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: "u1",
            email: "t@t.com",
            role: "doctor",
        });
        const res = await POST(createPostRequest({ slotId: "s1" }));
        expect(res.status).toBe(403);
    });

    it("should return 400 when slotId is missing", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: "u1",
            email: "t@t.com",
            role: "patient",
        });
        const res = await POST(createPostRequest({}));
        expect(res.status).toBe(400);
    });

    it("should return 409 when slot is already booked", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: "u1",
            email: "t@t.com",
            role: "patient",
        });
        mockSlotFindOneAndUpdate.mockResolvedValue(null);
        const res = await POST(createPostRequest({ slotId: "s1" }));
        expect(res.status).toBe(409);
    });

    it("should return 201 and create booking on success", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: "u1",
            email: "t@t.com",
            role: "patient",
        });
        mockSlotFindOneAndUpdate.mockResolvedValue({
            _id: "s1",
            doctorId: "d1",
            dateTime: new Date(),
        });
        mockBookingCreate.mockResolvedValue({
            _id: "b1",
            patientId: "u1",
            doctorId: "d1",
            slotId: "s1",
            status: "pending",
        });

        const res = await POST(
            createPostRequest({ slotId: "s1", notes: "Test note" }),
        );
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.booking.status).toBe("pending");
        expect(mockBookingCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                patientId: "u1",
                doctorId: "d1",
                slotId: "s1",
                status: "pending",
            }),
        );
    });

    it("should atomically mark slot as booked", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: "u1",
            email: "t@t.com",
            role: "patient",
        });
        mockSlotFindOneAndUpdate.mockResolvedValue({
            _id: "s1",
            doctorId: "d1",
        });
        mockBookingCreate.mockResolvedValue({ _id: "b1" });

        await POST(createPostRequest({ slotId: "s1" }));
        expect(mockSlotFindOneAndUpdate).toHaveBeenCalledWith(
            { _id: "s1", isBooked: false },
            { isBooked: true, bookedBy: "u1" },
            { new: true },
        );
    });

    it("should return 500 on unexpected error", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: "u1",
            email: "t@t.com",
            role: "patient",
        });
        mockSlotFindOneAndUpdate.mockRejectedValue(new Error("fail"));
        const res = await POST(createPostRequest({ slotId: "s1" }));
        expect(res.status).toBe(500);
    });
});

describe("GET /api/bookings", () => {
    it("should return 401 when not authenticated", async () => {
        mockGetAuthUser.mockResolvedValue(null);
        const res = await GET();
        expect(res.status).toBe(401);
    });

    it("should return patient bookings filtered by patientId", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: "u1",
            email: "t@t.com",
            role: "patient",
        });
        const chain = createFindChain([{ _id: "b1", status: "pending" }]);
        mockBookingFind.mockReturnValue(chain);

        const res = await GET();
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.bookings).toHaveLength(1);
        expect(mockBookingFind).toHaveBeenCalledWith({ patientId: "u1" });
    });

    it("should return doctor bookings filtered by doctorId", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: "u1",
            email: "t@t.com",
            role: "doctor",
        });
        mockUserFindById.mockReturnValue(
            createLeanChain({ _id: "u1", doctorProfile: "dp1" }),
        );
        const chain = createFindChain([]);
        mockBookingFind.mockReturnValue(chain);

        const res = await GET();
        expect(res.status).toBe(200);
        expect(mockBookingFind).toHaveBeenCalledWith({ doctorId: "dp1" });
    });

    it("should return empty array when doctor has no profile", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: "u1",
            email: "t@t.com",
            role: "doctor",
        });
        mockUserFindById.mockReturnValue(createLeanChain({ _id: "u1" }));

        const res = await GET();
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.bookings).toEqual([]);
    });

    it("should sort by createdAt descending", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: "u1",
            email: "t@t.com",
            role: "patient",
        });
        const chain = createFindChain([]);
        mockBookingFind.mockReturnValue(chain);

        await GET();
        expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });
});
