import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/mongodb", () => ({
    connectDB: vi.fn().mockResolvedValue(undefined),
}));

const mockGetAuthUser = vi.fn();

vi.mock("@/lib/auth", () => ({
    getAuthUser: (...args: unknown[]) => mockGetAuthUser(...args),
}));

function createLeanChain(resolvedValue: unknown) {
    return { lean: vi.fn().mockResolvedValue(resolvedValue) };
}

const mockUserFindById = vi.fn();

vi.mock("@/models/User", () => ({
    User: {
        findById: (...args: unknown[]) => mockUserFindById(...args),
    },
}));

const mockSlotDeleteMany = vi.fn().mockResolvedValue(undefined);
const mockSlotInsertMany = vi.fn();

vi.mock("@/models/Slot", () => ({
    Slot: {
        deleteMany: (...args: unknown[]) => mockSlotDeleteMany(...args),
        insertMany: (...args: unknown[]) => mockSlotInsertMany(...args),
    },
}));

import { POST } from "@/app/api/doctors/[id]/slots/route";

const VALID_ID = "507f1f77bcf86cd799439011";

function createRequest(body: Record<string, unknown>) {
    return new NextRequest(
        new URL(`http://localhost:3000/api/doctors/${VALID_ID}/slots`),
        {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        },
    );
}

function createParams(id: string) {
    return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
});

describe("POST /api/doctors/:id/slots", () => {
    describe("authorization", () => {
        it("should return 401 when not authenticated", async () => {
            mockGetAuthUser.mockResolvedValue(null);
            const res = await POST(
                createRequest({
                    startDate: "2025-04-01",
                    endDate: "2025-04-02",
                }),
                createParams(VALID_ID),
            );
            expect(res.status).toBe(401);
        });

        it("should return 403 when user is not a doctor", async () => {
            mockGetAuthUser.mockResolvedValue({
                userId: "u1",
                email: "t@t.com",
                role: "patient",
            });
            const res = await POST(
                createRequest({
                    startDate: "2025-04-01",
                    endDate: "2025-04-02",
                }),
                createParams(VALID_ID),
            );
            expect(res.status).toBe(403);
        });

        it("should return 400 for invalid doctor ID", async () => {
            mockGetAuthUser.mockResolvedValue({
                userId: "u1",
                email: "t@t.com",
                role: "doctor",
            });
            const res = await POST(
                createRequest({
                    startDate: "2025-04-01",
                    endDate: "2025-04-02",
                }),
                createParams("invalid"),
            );
            expect(res.status).toBe(400);
        });

        it("should return 403 when doctor does not own profile", async () => {
            mockGetAuthUser.mockResolvedValue({
                userId: "u1",
                email: "t@t.com",
                role: "doctor",
            });
            mockUserFindById.mockReturnValue(
                createLeanChain({ _id: "u1", doctorProfile: "other_id" }),
            );
            const res = await POST(
                createRequest({
                    startDate: "2025-04-01",
                    endDate: "2025-04-02",
                }),
                createParams(VALID_ID),
            );
            expect(res.status).toBe(403);
        });
    });

    describe("validation", () => {
        beforeEach(() => {
            mockGetAuthUser.mockResolvedValue({
                userId: "u1",
                email: "t@t.com",
                role: "doctor",
            });
            mockUserFindById.mockReturnValue(
                createLeanChain({ _id: "u1", doctorProfile: VALID_ID }),
            );
        });

        it("should return 400 when startDate is missing", async () => {
            const res = await POST(
                createRequest({ endDate: "2025-04-02" }),
                createParams(VALID_ID),
            );
            expect(res.status).toBe(400);
        });

        it("should return 400 when endDate is missing", async () => {
            const res = await POST(
                createRequest({ startDate: "2025-04-01" }),
                createParams(VALID_ID),
            );
            expect(res.status).toBe(400);
        });

        it("should return 400 when endDate is before startDate", async () => {
            const res = await POST(
                createRequest({
                    startDate: "2025-04-05",
                    endDate: "2025-04-01",
                }),
                createParams(VALID_ID),
            );
            expect(res.status).toBe(400);
        });

        it("should return 400 when date range exceeds 30 days", async () => {
            const res = await POST(
                createRequest({
                    startDate: "2025-04-01",
                    endDate: "2025-06-01",
                }),
                createParams(VALID_ID),
            );
            expect(res.status).toBe(400);
        });
    });

    describe("slot generation", () => {
        beforeEach(() => {
            mockGetAuthUser.mockResolvedValue({
                userId: "u1",
                email: "t@t.com",
                role: "doctor",
            });
            mockUserFindById.mockReturnValue(
                createLeanChain({ _id: "u1", doctorProfile: VALID_ID }),
            );
            // Fix time to a Monday morning so slots in future are generated
            vi.useFakeTimers();
            vi.setSystemTime(new Date("2025-03-24T06:00:00")); // Monday
        });

        it("should return 201 with count of created slots", async () => {
            mockSlotInsertMany.mockResolvedValue(new Array(16).fill({}));
            const res = await POST(
                createRequest({
                    startDate: "2025-03-24",
                    endDate: "2025-03-24",
                }),
                createParams(VALID_ID),
            );
            expect(res.status).toBe(201);
            const data = await res.json();
            expect(data.count).toBeGreaterThan(0);
            expect(data.message).toContain("Генерирани");
        });

        it("should delete existing unbooked slots in range", async () => {
            mockSlotInsertMany.mockResolvedValue(new Array(16).fill({}));
            await POST(
                createRequest({
                    startDate: "2025-03-24",
                    endDate: "2025-03-24",
                }),
                createParams(VALID_ID),
            );
            expect(mockSlotDeleteMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    doctorId: VALID_ID,
                    isBooked: false,
                }),
            );
        });

        it("should skip weekends (Saturday and Sunday)", async () => {
            // 2025-03-29 is Saturday, 2025-03-30 is Sunday
            mockSlotInsertMany.mockImplementation((slots: unknown[]) => slots);
            const res = await POST(
                createRequest({
                    startDate: "2025-03-29",
                    endDate: "2025-03-30",
                }),
                createParams(VALID_ID),
            );
            // No valid slots on weekends
            expect(res.status).toBe(400);
        });

        it("should use default hours 9-17 and duration 30", async () => {
            mockSlotInsertMany.mockImplementation((slots: unknown[]) => slots);
            await POST(
                createRequest({
                    startDate: "2025-03-24",
                    endDate: "2025-03-24",
                }),
                createParams(VALID_ID),
            );
            const slots = mockSlotInsertMany.mock.calls[0][0];
            // 9-17 = 8 hours, 2 slots per hour = 16 slots
            expect(slots.length).toBe(16);
            expect(slots[0].durationMinutes).toBe(30);
        });
    });
});
