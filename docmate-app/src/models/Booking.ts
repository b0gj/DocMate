import mongoose, { Schema, type InferSchemaType } from "mongoose";

const bookingSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    slotId: {
      type: Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    notes: { type: String },
    cancelledBy: {
      type: String,
      enum: ["patient", "doctor"],
    },
  },
  { timestamps: true }
);

bookingSchema.index({ patientId: 1, status: 1 });
bookingSchema.index({ doctorId: 1, status: 1 });

export type IBooking = InferSchemaType<typeof bookingSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
