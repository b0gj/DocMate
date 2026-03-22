import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/mongodb", () => ({
    connectDB: vi.fn().mockResolvedValue(undefined),
}));

function createFindByIdChain(resolvedValue: unknown) {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    chain.lean = vi.fn().mockResolvedValue(resolvedValue);
    return chain;
}

function createFindChain(resolvedValue: unknown) {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    chain.sort = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);
    chain.lean = vi.fn().mockResolvedValue(resolvedValue);
    return chain;
}

const mockDoctorFindById = vi.fn();

vi.mock("@/models/Doctor", () => ({
    Doctor: {
        findById: (...args: unknown[]) => mockDoctorFindById(...args),
    },
}));

const mockSlotFind = vi.fn();

vi.mock("@/models/Slot", () => ({
    Slot: {
        find: (...args: unknown[]) => mockSlotFind(...args),
    },
}));

import { GET } from "@/app/api/doctors/[id]/route";

const VALID_ID = "507f1f77bcf86cd799439011";

function createParams(id: string) {
    return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("GET /api/doctors/:id", () => {
    it("should return 400 for invalid ObjectId", async () => {
        const req = new NextRequest(
            new URL("http://localhost:3000/api/doctors/invalid"),
        );
        const res = await GET(req, createParams("invalid-id"));
        expect(res.status).toBe(400);
    });

    it("should return 404 when doctor not found", async () => {
        mockDoctorFindById.mockReturnValue(createFindByIdChain(null));
        const req = new NextRequest(
            new URL(`http://localhost:3000/api/doctors/${VALID_ID}`),
        );
        const res = await GET(req, createParams(VALID_ID));
        expect(res.status).toBe(404);
    });

    it("should return 200 with doctor and slots", async () => {
        const doctor = { _id: VALID_ID, name: "Doc", specialty: "Кардиолог" };
        const slots = [
            {
                _id: "s1",
                dateTime: new Date("2025-04-01T10:00:00"),
                durationMinutes: 30,
            },
        ];
        mockDoctorFindById.mockReturnValue(createFindByIdChain(doctor));
        mockSlotFind.mockReturnValue(createFindChain(slots));

        const req = new NextRequest(
            new URL(`http://localhost:3000/api/doctors/${VALID_ID}`),
        );
        const res = await GET(req, createParams(VALID_ID));
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.doctor.name).toBe("Doc");
        expect(data.slots).toHaveLength(1);
    });

    it("should only query future unbooked slots", async () => {
        mockDoctorFindById.mockReturnValue(
            createFindByIdChain({ _id: VALID_ID }),
        );
        mockSlotFind.mockReturnValue(createFindChain([]));

        const req = new NextRequest(
            new URL(`http://localhost:3000/api/doctors/${VALID_ID}`),
        );
        await GET(req, createParams(VALID_ID));

        const filter = mockSlotFind.mock.calls[0][0];
        expect(filter.doctorId).toBe(VALID_ID);
        expect(filter.isBooked).toBe(false);
        expect(filter.dateTime.$gte).toBeInstanceOf(Date);
    });

    it("should limit to 50 slots sorted ascending", async () => {
        mockDoctorFindById.mockReturnValue(
            createFindByIdChain({ _id: VALID_ID }),
        );
        const chain = createFindChain([]);
        mockSlotFind.mockReturnValue(chain);

        const req = new NextRequest(
            new URL(`http://localhost:3000/api/doctors/${VALID_ID}`),
        );
        await GET(req, createParams(VALID_ID));

        expect(chain.sort).toHaveBeenCalledWith({ dateTime: 1 });
        expect(chain.limit).toHaveBeenCalledWith(50);
    });
});
