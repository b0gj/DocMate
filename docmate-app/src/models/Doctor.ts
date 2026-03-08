import mongoose, { Schema, type InferSchemaType } from "mongoose";

const doctorSchema = new Schema(
  {
    name: { type: String, required: true },
    specialty: { type: String, required: true, index: true },
    city: { type: String, required: true, index: true },
    hospital: { type: String, required: true },
    price: { type: Number, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    imageUrl: { type: String },
    bio: { type: String },
    workingHours: { type: String },
    phone: { type: String },
  },
  { timestamps: true }
);

doctorSchema.index({ name: "text", specialty: "text" });

export type IDoctor = InferSchemaType<typeof doctorSchema> & { _id: mongoose.Types.ObjectId };

export const Doctor =
  mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);
