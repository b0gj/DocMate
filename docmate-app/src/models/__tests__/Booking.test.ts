import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { Booking } from "@/models/Booking";

const validBooking = {
  patientId: new mongoose.Types.ObjectId(),
  doctorId: new mongoose.Types.ObjectId(),
  slotId: new mongoose.Types.ObjectId(),
};

describe("Booking model validation", () => {
  it("should accept a valid booking with all required fields", () => {
    const booking = new Booking(validBooking);
    const error = booking.validateSync();
    expect(error).toBeUndefined();
  });

  it("should reject booking without patientId", () => {
    const booking = new Booking({ ...validBooking, patientId: undefined });
    const error = booking.validateSync();
    expect(error).toBeDefined();
    expect(error!.errors.patientId).toBeDefined();
  });

  it("should reject booking without doctorId", () => {
    const booking = new Booking({ ...validBooking, doctorId: undefined });
    const error = booking.validateSync();
    expect(error).toBeDefined();
    expect(error!.errors.doctorId).toBeDefined();
  });

  it("should reject booking without slotId", () => {
    const booking = new Booking({ ...validBooking, slotId: undefined });
    const error = booking.validateSync();
    expect(error).toBeDefined();
    expect(error!.errors.slotId).toBeDefined();
  });

  it("should default status to pending", () => {
    const booking = new Booking(validBooking);
    expect(booking.status).toBe("pending");
  });

  it("should accept status confirmed", () => {
    const booking = new Booking({ ...validBooking, status: "confirmed" });
    const error = booking.validateSync();
    expect(error).toBeUndefined();
  });

  it("should accept status cancelled", () => {
    const booking = new Booking({ ...validBooking, status: "cancelled" });
    const error = booking.validateSync();
    expect(error).toBeUndefined();
  });

  it("should reject invalid status", () => {
    const booking = new Booking({ ...validBooking, status: "invalid" });
    const error = booking.validateSync();
    expect(error).toBeDefined();
    expect(error!.errors.status).toBeDefined();
  });

  it("should accept optional notes", () => {
    const booking = new Booking({ ...validBooking, notes: "Главоболие" });
    const error = booking.validateSync();
    expect(error).toBeUndefined();
    expect(booking.notes).toBe("Главоболие");
  });

  it("should accept cancelledBy patient or doctor", () => {
    const b1 = new Booking({ ...validBooking, cancelledBy: "patient" });
    const b2 = new Booking({ ...validBooking, cancelledBy: "doctor" });
    expect(b1.validateSync()).toBeUndefined();
    expect(b2.validateSync()).toBeUndefined();
  });

  it("should reject invalid cancelledBy value", () => {
    const booking = new Booking({ ...validBooking, cancelledBy: "admin" });
    const error = booking.validateSync();
    expect(error).toBeDefined();
    expect(error!.errors.cancelledBy).toBeDefined();
  });
});
