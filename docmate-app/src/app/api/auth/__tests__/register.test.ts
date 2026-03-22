import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/mongodb", () => ({
    connectDB: vi.fn().mockResolvedValue(undefined),
}));

const mockSetAuthCookie = vi.fn().mockResolvedValue(undefined);
const mockHashPassword = vi.fn().mockResolvedValue("hashed_password");

vi.mock("@/lib/auth", () => ({
    hashPassword: (...args: unknown[]) => mockHashPassword(...args),
    setAuthCookie: (...args: unknown[]) => mockSetAuthCookie(...args),
}));

const mockUserFindOne = vi.fn();
const mockUserCreate = vi.fn();

vi.mock("@/models/User", () => ({
    User: {
        findOne: (...args: unknown[]) => mockUserFindOne(...args),
        create: (...args: unknown[]) => mockUserCreate(...args),
    },
}));

const mockDoctorCreate = vi.fn();

vi.mock("@/models/Doctor", () => ({
    Doctor: {
        create: (...args: unknown[]) => mockDoctorCreate(...args),
    },
}));

import { POST } from "@/app/api/auth/register/route";

function createRequest(body: Record<string, unknown>) {
    return new NextRequest(new URL("http://localhost:3000/api/auth/register"), {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
    });
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("POST /api/auth/register", () => {
    describe("validation", () => {
        it("should return 400 when email is missing", async () => {
            const res = await POST(
                createRequest({
                    password: "123456",
                    name: "Test",
                    role: "patient",
                }),
            );
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toBeDefined();
        });

        it("should return 400 when password is missing", async () => {
            const res = await POST(
                createRequest({
                    email: "t@t.com",
                    name: "Test",
                    role: "patient",
                }),
            );
            expect(res.status).toBe(400);
        });

        it("should return 400 when name is missing", async () => {
            const res = await POST(
                createRequest({
                    email: "t@t.com",
                    password: "123456",
                    role: "patient",
                }),
            );
            expect(res.status).toBe(400);
        });

        it("should return 400 when role is missing", async () => {
            const res = await POST(
                createRequest({
                    email: "t@t.com",
                    password: "123456",
                    name: "Test",
                }),
            );
            expect(res.status).toBe(400);
        });

        it("should return 400 for invalid role value", async () => {
            const res = await POST(
                createRequest({
                    email: "t@t.com",
                    password: "123456",
                    name: "Test",
                    role: "admin",
                }),
            );
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain("роля");
        });

        it("should return 400 when password is shorter than 6 characters", async () => {
            const res = await POST(
                createRequest({
                    email: "t@t.com",
                    password: "12345",
                    name: "Test",
                    role: "patient",
                }),
            );
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain("6");
        });

        it("should return 400 for doctor without specialty", async () => {
            const res = await POST(
                createRequest({
                    email: "t@t.com",
                    password: "123456",
                    name: "Doc",
                    role: "doctor",
                    hospital: "Hospital",
                    price: 50,
                }),
            );
            expect(res.status).toBe(400);
        });

        it("should return 400 for doctor without hospital", async () => {
            const res = await POST(
                createRequest({
                    email: "t@t.com",
                    password: "123456",
                    name: "Doc",
                    role: "doctor",
                    specialty: "Кардиолог",
                    price: 50,
                }),
            );
            expect(res.status).toBe(400);
        });

        it("should return 400 for doctor without price", async () => {
            const res = await POST(
                createRequest({
                    email: "t@t.com",
                    password: "123456",
                    name: "Doc",
                    role: "doctor",
                    specialty: "Кардиолог",
                    hospital: "Hospital",
                }),
            );
            expect(res.status).toBe(400);
        });
    });

    describe("duplicate email", () => {
        it("should return 409 when email already exists", async () => {
            mockUserFindOne.mockResolvedValue({ email: "existing@test.com" });
            const res = await POST(
                createRequest({
                    email: "existing@test.com",
                    password: "123456",
                    name: "Test",
                    role: "patient",
                }),
            );
            expect(res.status).toBe(409);
        });
    });

    describe("successful patient registration", () => {
        it("should return 201 with user data", async () => {
            mockUserFindOne.mockResolvedValue(null);
            mockUserCreate.mockResolvedValue({
                _id: "user_id_1",
                email: "new@test.com",
                name: "Test User",
                role: "patient",
            });

            const res = await POST(
                createRequest({
                    email: "new@test.com",
                    password: "123456",
                    name: "Test User",
                    role: "patient",
                }),
            );

            expect(res.status).toBe(201);
            const data = await res.json();
            expect(data.user.email).toBe("new@test.com");
            expect(data.user.name).toBe("Test User");
            expect(data.user.role).toBe("patient");
            expect(mockHashPassword).toHaveBeenCalledWith("123456");
            expect(mockSetAuthCookie).toHaveBeenCalledWith({
                userId: "user_id_1",
                email: "new@test.com",
                role: "patient",
            });
            expect(mockDoctorCreate).not.toHaveBeenCalled();
        });
    });

    describe("successful doctor registration", () => {
        it("should return 201 and create Doctor document", async () => {
            mockUserFindOne.mockResolvedValue(null);
            mockDoctorCreate.mockResolvedValue({ _id: "doctor_profile_id" });
            mockUserCreate.mockResolvedValue({
                _id: "user_id_2",
                email: "doc@test.com",
                name: "Doctor",
                role: "doctor",
            });

            const res = await POST(
                createRequest({
                    email: "doc@test.com",
                    password: "123456",
                    name: "Doctor",
                    role: "doctor",
                    specialty: "Кардиолог",
                    hospital: "УМБАЛ",
                    price: 80,
                }),
            );

            expect(res.status).toBe(201);
            expect(mockDoctorCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: "Doctor",
                    specialty: "Кардиолог",
                    hospital: "УМБАЛ",
                    price: 80,
                    rating: 0,
                }),
            );
        });
    });

    describe("error handling", () => {
        it("should return 500 when database throws", async () => {
            mockUserFindOne.mockRejectedValue(new Error("DB error"));
            const res = await POST(
                createRequest({
                    email: "t@t.com",
                    password: "123456",
                    name: "Test",
                    role: "patient",
                }),
            );
            expect(res.status).toBe(500);
        });
    });
});
