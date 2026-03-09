import mongoose, { Schema, type InferSchemaType } from "mongoose";

const slotSchema = new Schema(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    dateTime: { type: Date, required: true },
    durationMinutes: { type: Number, default: 30 },
    isBooked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

slotSchema.index({ doctorId: 1, dateTime: 1 });

export type ISlot = InferSchemaType<typeof slotSchema> & { _id: mongoose.Types.ObjectId };

export const Slot =
  mongoose.models.Slot || mongoose.model("Slot", slotSchema);
