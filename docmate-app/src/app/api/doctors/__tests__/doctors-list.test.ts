import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/mongodb", () => ({
    connectDB: vi.fn().mockResolvedValue(undefined),
}));

function createFindChain(resolvedValue: unknown) {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    chain.sort = vi.fn().mockReturnValue(chain);
    chain.skip = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);
    chain.lean = vi.fn().mockResolvedValue(resolvedValue);
    return chain;
}

const mockDoctorFind = vi.fn();
const mockDoctorCountDocuments = vi.fn();

vi.mock("@/models/Doctor", () => ({
    Doctor: {
        find: (...args: unknown[]) => mockDoctorFind(...args),
        countDocuments: (...args: unknown[]) =>
            mockDoctorCountDocuments(...args),
    },
}));

const mockSlotDistinct = vi.fn();
const mockSlotAggregate = vi.fn();

vi.mock("@/models/Slot", () => ({
    Slot: {
        distinct: (...args: unknown[]) => mockSlotDistinct(...args),
        aggregate: (...args: unknown[]) => mockSlotAggregate(...args),
    },
}));

import { GET } from "@/app/api/doctors/route";

function createRequest(params: Record<string, string> = {}) {
    const url = new URL("http://localhost:3000/api/doctors");
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }
    return new NextRequest(url);
}

const sampleDoctors = [
    {
        _id: "d1",
        name: "Doc 1",
        specialty: "Кардиолог",
        price: 50,
        rating: 4.5,
    },
    { _id: "d2", name: "Doc 2", specialty: "Невролог", price: 80, rating: 3.0 },
];

beforeEach(() => {
    vi.clearAllMocks();
    mockDoctorFind.mockReturnValue(createFindChain(sampleDoctors));
    mockDoctorCountDocuments.mockResolvedValue(2);
    mockSlotAggregate.mockResolvedValue([]);
});

describe("GET /api/doctors", () => {
    it("should return doctors array and pagination", async () => {
        const res = await GET(createRequest());
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.doctors).toBeDefined();
        expect(data.pagination).toBeDefined();
        expect(data.pagination.page).toBe(1);
        expect(data.pagination.limit).toBe(10);
    });

    it("should default to page 1 and limit 10", async () => {
        await GET(createRequest());
        const chain = mockDoctorFind.mock.results[0].value;
        expect(chain.skip).toHaveBeenCalledWith(0);
        expect(chain.limit).toHaveBeenCalledWith(10);
    });

    it("should clamp limit to max 50", async () => {
        await GET(createRequest({ limit: "100" }));
        const chain = mockDoctorFind.mock.results[0].value;
        expect(chain.limit).toHaveBeenCalledWith(50);
    });

    it("should filter by search term", async () => {
        await GET(createRequest({ search: "Кардио" }));
        const filter = mockDoctorFind.mock.calls[0][0];
        expect(filter.$or).toBeDefined();
        expect(filter.$or[0].name.$regex).toBe("Кардио");
    });

    it("should filter by exact specialty", async () => {
        await GET(createRequest({ specialty: "Невролог" }));
        const filter = mockDoctorFind.mock.calls[0][0];
        expect(filter.specialty).toBe("Невролог");
    });

    it("should filter by exact city", async () => {
        await GET(createRequest({ city: "София" }));
        const filter = mockDoctorFind.mock.calls[0][0];
        expect(filter.city).toBe("София");
    });

    it("should filter by maxPrice", async () => {
        await GET(createRequest({ maxPrice: "70" }));
        const filter = mockDoctorFind.mock.calls[0][0];
        expect(filter.price).toEqual({ $lte: 70 });
    });

    it("should filter by minRating", async () => {
        await GET(createRequest({ minRating: "4" }));
        const filter = mockDoctorFind.mock.calls[0][0];
        expect(filter.rating).toEqual({ $gte: 4 });
    });

    it("should sort by rating-desc by default", async () => {
        await GET(createRequest());
        const chain = mockDoctorFind.mock.results[0].value;
        expect(chain.sort).toHaveBeenCalledWith({ rating: -1 });
    });

    it("should sort by price-asc", async () => {
        await GET(createRequest({ sort: "price-asc" }));
        const chain = mockDoctorFind.mock.results[0].value;
        expect(chain.sort).toHaveBeenCalledWith({ price: 1 });
    });

    it("should sort by price-desc", async () => {
        await GET(createRequest({ sort: "price-desc" }));
        const chain = mockDoctorFind.mock.results[0].value;
        expect(chain.sort).toHaveBeenCalledWith({ price: -1 });
    });

    it("should return correct totalPages", async () => {
        mockDoctorCountDocuments.mockResolvedValue(25);
        const res = await GET(createRequest({ limit: "10" }));
        const data = await res.json();
        expect(data.pagination.totalPages).toBe(3);
    });

    it("should include nextAvailableSlot for each doctor", async () => {
        mockSlotAggregate.mockResolvedValue([
            { _id: "d1", nextSlot: new Date("2025-04-01T10:00:00") },
        ]);
        const res = await GET(createRequest());
        const data = await res.json();
        expect(data.doctors[0].nextAvailableSlot).toBeDefined();
        expect(data.doctors[1].nextAvailableSlot).toBeNull();
    });
});
