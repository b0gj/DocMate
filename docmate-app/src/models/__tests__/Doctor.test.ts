import { describe, it, expect } from "vitest";
import { Doctor } from "@/models/Doctor";

const validDoctor = {
  name: "Д-р Мария Иванова",
  specialty: "Кардиолог",
  city: "София",
  hospital: "УМБАЛ Александровска",
  price: 80,
  rating: 4.5,
};

describe("Doctor model validation", () => {
  it("should accept a valid doctor with all required fields", () => {
    const doc = new Doctor(validDoctor);
    const error = doc.validateSync();
    expect(error).toBeUndefined();
  });

  it("should reject doctor without name", () => {
    const doc = new Doctor({ ...validDoctor, name: undefined });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error!.errors.name).toBeDefined();
  });

  it("should reject doctor without specialty", () => {
    const doc = new Doctor({ ...validDoctor, specialty: undefined });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error!.errors.specialty).toBeDefined();
  });

  it("should reject doctor without city", () => {
    const doc = new Doctor({ ...validDoctor, city: undefined });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error!.errors.city).toBeDefined();
  });

  it("should reject doctor without hospital", () => {
    const doc = new Doctor({ ...validDoctor, hospital: undefined });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error!.errors.hospital).toBeDefined();
  });

  it("should reject doctor without price", () => {
    const doc = new Doctor({ ...validDoctor, price: undefined });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error!.errors.price).toBeDefined();
  });

  it("should reject rating below 0", () => {
    const doc = new Doctor({ ...validDoctor, rating: -1 });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error!.errors.rating).toBeDefined();
  });

  it("should reject rating above 5", () => {
    const doc = new Doctor({ ...validDoctor, rating: 6 });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error!.errors.rating).toBeDefined();
  });

  it("should accept rating of exactly 0", () => {
    const doc = new Doctor({ ...validDoctor, rating: 0 });
    const error = doc.validateSync();
    expect(error).toBeUndefined();
  });

  it("should accept rating of exactly 5", () => {
    const doc = new Doctor({ ...validDoctor, rating: 5 });
    const error = doc.validateSync();
    expect(error).toBeUndefined();
  });

  it("should accept optional imageUrl, bio, workingHours, phone", () => {
    const doc = new Doctor({
      ...validDoctor,
      imageUrl: "https://example.com/img.jpg",
      bio: "Опитен кардиолог",
      workingHours: "09:00 - 17:00",
      phone: "0888111222",
    });
    const error = doc.validateSync();
    expect(error).toBeUndefined();
  });
});
