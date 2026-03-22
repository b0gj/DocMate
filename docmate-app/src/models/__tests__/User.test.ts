import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { User } from "@/models/User";

const validUser = {
    email: "Test@Example.COM",
    password: "hashedpassword123",
    name: "  Иван Петров  ",
    role: "patient" as const,
};

describe("User model validation", () => {
    it("should accept a valid patient user", () => {
        const user = new User(validUser);
        const error = user.validateSync();
        expect(error).toBeUndefined();
    });

    it("should accept a valid doctor user", () => {
        const user = new User({ ...validUser, role: "doctor" });
        const error = user.validateSync();
        expect(error).toBeUndefined();
    });

    it("should reject user without email", () => {
        const user = new User({ ...validUser, email: undefined });
        const error = user.validateSync();
        expect(error).toBeDefined();
        expect(error!.errors.email).toBeDefined();
    });

    it("should reject user without password", () => {
        const user = new User({ ...validUser, password: undefined });
        const error = user.validateSync();
        expect(error).toBeDefined();
        expect(error!.errors.password).toBeDefined();
    });

    it("should reject user without name", () => {
        const user = new User({ ...validUser, name: undefined });
        const error = user.validateSync();
        expect(error).toBeDefined();
        expect(error!.errors.name).toBeDefined();
    });

    it("should reject user with invalid role", () => {
        const user = new User({ ...validUser, role: "admin" });
        const error = user.validateSync();
        expect(error).toBeDefined();
        expect(error!.errors.role).toBeDefined();
    });

    it("should default role to patient when not specified", () => {
        const user = new User({
            email: "test@example.com",
            password: "hash",
            name: "Test",
        });
        expect(user.role).toBe("patient");
    });

    it("should lowercase email", () => {
        const user = new User(validUser);
        expect(user.email).toBe("test@example.com");
    });

    it("should trim name", () => {
        const user = new User(validUser);
        expect(user.name).toBe("Иван Петров");
    });

    it("should accept optional phone and city", () => {
        const user = new User({
            ...validUser,
            phone: "0888123456",
            city: "София",
        });
        const error = user.validateSync();
        expect(error).toBeUndefined();
        expect(user.phone).toBe("0888123456");
        expect(user.city).toBe("София");
    });

    it("should accept optional doctorProfile ObjectId", () => {
        const objectId = new mongoose.Types.ObjectId();
        const user = new User({
            ...validUser,
            role: "doctor",
            doctorProfile: objectId,
        });
        const error = user.validateSync();
        expect(error).toBeUndefined();
        expect(user.doctorProfile!.toString()).toBe(objectId.toString());
    });
});
