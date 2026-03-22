import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { Slot } from "@/models/Slot";

const validSlot = {
  doctorId: new mongoose.Types.ObjectId(),
  dateTime: new Date("2025-04-01T10:00:00"),
};

describe("Slot model validation", () => {
  it("should accept a valid slot with required fields", () => {
    const slot = new Slot(validSlot);
    const error = slot.validateSync();
    expect(error).toBeUndefined();
  });

  it("should reject slot without doctorId", () => {
    const slot = new Slot({ ...validSlot, doctorId: undefined });
    const error = slot.validateSync();
    expect(error).toBeDefined();
    expect(error!.errors.doctorId).toBeDefined();
  });

  it("should reject slot without dateTime", () => {
    const slot = new Slot({ ...validSlot, dateTime: undefined });
    const error = slot.validateSync();
    expect(error).toBeDefined();
    expect(error!.errors.dateTime).toBeDefined();
  });

  it("should default durationMinutes to 30", () => {
    const slot = new Slot(validSlot);
    expect(slot.durationMinutes).toBe(30);
  });

  it("should default isBooked to false", () => {
    const slot = new Slot(validSlot);
    expect(slot.isBooked).toBe(false);
  });

  it("should accept custom durationMinutes", () => {
    const slot = new Slot({ ...validSlot, durationMinutes: 60 });
    expect(slot.durationMinutes).toBe(60);
  });

  it("should accept optional bookedBy", () => {
    const userId = new mongoose.Types.ObjectId();
    const slot = new Slot({ ...validSlot, isBooked: true, bookedBy: userId });
    const error = slot.validateSync();
    expect(error).toBeUndefined();
    expect(slot.bookedBy!.toString()).toBe(userId.toString());
  });
});
