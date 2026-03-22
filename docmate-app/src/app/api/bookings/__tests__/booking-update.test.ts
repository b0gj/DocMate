import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/mongodb", () => ({
    connectDB: vi.fn().mockResolvedValue(undefined),
}));

const mockGetAuthUser = vi.fn();

vi.mock("@/lib/auth", () => ({
    getAuthUser: (...args: unknown[]) => mockGetAuthUser(...args),
}));

const mockBookingFindById = vi.fn();

vi.mock("@/models/Booking", () => ({
    Booking: {
        findById: (...args: unknown[]) => mockBookingFindById(...args),
    },
}));

const mockSlotFindByIdAndUpdate = vi.fn().mockResolvedValue(undefined);

vi.mock("@/models/Slot", () => ({
    Slot: {
        findByIdAndUpdate: (...args: unknown[]) =>
            mockSlotFindByIdAndUpdate(...args),
    },
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

import { PATCH } from "@/app/api/bookings/[id]/route";

const VALID_ID = "507f1f77bcf86cd799439011";
const PATIENT_ID = "507f1f77bcf86cd799439022";
const DOCTOR_PROFILE_ID = "507f1f77bcf86cd799439033";
const SLOT_ID = "507f1f77bcf86cd799439044";

function createRequest(body: Record<string, unknown>) {
    return new NextRequest(
        new URL(`http://localhost:3000/api/bookings/${VALID_ID}`),
        {
            method: "PATCH",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        },
    );
}

function createParams(id: string) {
    return { params: Promise.resolve({ id }) };
}

function createMockBooking(overrides: Record<string, unknown> = {}) {
    const booking: Record<string, unknown> = {
        _id: VALID_ID,
        patientId: { toString: () => PATIENT_ID },
        doctorId: { toString: () => DOCTOR_PROFILE_ID },
        slotId: SLOT_ID,
        status: "pending",
        cancelledBy: undefined,
        save: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
    return booking;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("PATCH /api/bookings/:id", () => {
    it("should return 401 when not authenticated", async () => {
        mockGetAuthUser.mockResolvedValue(null);
        const res = await PATCH(
            createRequest({ status: "cancelled" }),
            createParams(VALID_ID),
        );
        expect(res.status).toBe(401);
    });

    it("should return 400 for invalid booking ID", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: PATIENT_ID,
            email: "t@t.com",
            role: "patient",
        });
        const res = await PATCH(
            createRequest({ status: "cancelled" }),
            createParams("invalid"),
        );
        expect(res.status).toBe(400);
    });

    it("should return 400 for invalid status", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: PATIENT_ID,
            email: "t@t.com",
            role: "patient",
        });
        const res = await PATCH(
            createRequest({ status: "invalid" }),
            createParams(VALID_ID),
        );
        expect(res.status).toBe(400);
    });

    it("should return 404 when booking not found", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: PATIENT_ID,
            email: "t@t.com",
            role: "patient",
        });
        mockBookingFindById.mockResolvedValue(null);
        const res = await PATCH(
            createRequest({ status: "cancelled" }),
            createParams(VALID_ID),
        );
        expect(res.status).toBe(404);
    });

    it("should return 400 when booking is already cancelled", async () => {
        mockGetAuthUser.mockResolvedValue({
            userId: PATIENT_ID,
            email: "t@t.com",
            role: "patient",
        });
        mockBookingFindById.mockResolvedValue(
            createMockBooking({ status: "cancelled" }),
        );
        const res = await PATCH(
            createRequest({ status: "cancelled" }),
            createParams(VALID_ID),
        );
        expect(res.status).toBe(400);
    });

    describe("patient access", () => {
        it("should return 403 when patient tries to access another patient booking", async () => {
            mockGetAuthUser.mockResolvedValue({
                userId: "other_patient",
                email: "t@t.com",
                role: "patient",
            });
            mockBookingFindById.mockResolvedValue(createMockBooking());
            const res = await PATCH(
                createRequest({ status: "cancelled" }),
                createParams(VALID_ID),
            );
            expect(res.status).toBe(403);
        });

        it("should return 403 when patient tries to confirm", async () => {
            mockGetAuthUser.mockResolvedValue({
                userId: PATIENT_ID,
                email: "t@t.com",
                role: "patient",
            });
            mockBookingFindById.mockResolvedValue(createMockBooking());
            const res = await PATCH(
                createRequest({ status: "confirmed" }),
                createParams(VALID_ID),
            );
            expect(res.status).toBe(403);
        });

        it("should allow patient to cancel their own booking", async () => {
            const booking = createMockBooking();
            mockGetAuthUser.mockResolvedValue({
                userId: PATIENT_ID,
                email: "t@t.com",
                role: "patient",
            });
            mockBookingFindById.mockResolvedValue(booking);

            const res = await PATCH(
                createRequest({ status: "cancelled" }),
                createParams(VALID_ID),
            );
            expect(res.status).toBe(200);
            expect(booking.status).toBe("cancelled");
            expect(booking.cancelledBy).toBe("patient");
            expect(booking.save).toHaveBeenCalled();
        });
    });

    describe("doctor access", () => {
        it("should return 403 when doctor does not own booking doctor profile", async () => {
            mockGetAuthUser.mockResolvedValue({
                userId: "doc_user_1",
                email: "t@t.com",
                role: "doctor",
            });
            mockBookingFindById.mockResolvedValue(createMockBooking());
            mockUserFindById.mockReturnValue(
                createLeanChain({
                    _id: "doc_user_1",
                    doctorProfile: { toString: () => "different_profile" },
                }),
            );
            const res = await PATCH(
                createRequest({ status: "confirmed" }),
                createParams(VALID_ID),
            );
            expect(res.status).toBe(403);
        });

        it("should allow doctor to confirm a pending booking", async () => {
            const booking = createMockBooking();
            mockGetAuthUser.mockResolvedValue({
                userId: "doc_user_1",
                email: "t@t.com",
                role: "doctor",
            });
            mockBookingFindById.mockResolvedValue(booking);
            mockUserFindById.mockReturnValue(
                createLeanChain({
                    _id: "doc_user_1",
                    doctorProfile: { toString: () => DOCTOR_PROFILE_ID },
                }),
            );

            const res = await PATCH(
                createRequest({ status: "confirmed" }),
                createParams(VALID_ID),
            );
            expect(res.status).toBe(200);
            expect(booking.status).toBe("confirmed");
            expect(booking.save).toHaveBeenCalled();
        });

        it("should allow doctor to cancel a booking", async () => {
            const booking = createMockBooking();
            mockGetAuthUser.mockResolvedValue({
                userId: "doc_user_1",
                email: "t@t.com",
                role: "doctor",
            });
            mockBookingFindById.mockResolvedValue(booking);
            mockUserFindById.mockReturnValue(
                createLeanChain({
                    _id: "doc_user_1",
                    doctorProfile: { toString: () => DOCTOR_PROFILE_ID },
                }),
            );

            const res = await PATCH(
                createRequest({ status: "cancelled" }),
                createParams(VALID_ID),
            );
            expect(res.status).toBe(200);
            expect(booking.cancelledBy).toBe("doctor");
        });
    });

    describe("slot release on cancellation", () => {
        it("should free the slot when booking is cancelled", async () => {
            const booking = createMockBooking();
            mockGetAuthUser.mockResolvedValue({
                userId: PATIENT_ID,
                email: "t@t.com",
                role: "patient",
            });
            mockBookingFindById.mockResolvedValue(booking);

            await PATCH(
                createRequest({ status: "cancelled" }),
                createParams(VALID_ID),
            );
            expect(mockSlotFindByIdAndUpdate).toHaveBeenCalledWith(SLOT_ID, {
                isBooked: false,
                bookedBy: null,
            });
        });

        it("should NOT modify slot when booking is confirmed", async () => {
            const booking = createMockBooking();
            mockGetAuthUser.mockResolvedValue({
                userId: "doc_user_1",
                email: "t@t.com",
                role: "doctor",
            });
            mockBookingFindById.mockResolvedValue(booking);
            mockUserFindById.mockReturnValue(
                createLeanChain({
                    _id: "doc_user_1",
                    doctorProfile: { toString: () => DOCTOR_PROFILE_ID },
                }),
            );

            await PATCH(
                createRequest({ status: "confirmed" }),
                createParams(VALID_ID),
            );
            expect(mockSlotFindByIdAndUpdate).not.toHaveBeenCalled();
        });
    });

    it("should return 500 on unexpected error", async () => {
        mockGetAuthUser.mockRejectedValue(new Error("fail"));
        const res = await PATCH(
            createRequest({ status: "cancelled" }),
            createParams(VALID_ID),
        );
        expect(res.status).toBe(500);
    });
});
