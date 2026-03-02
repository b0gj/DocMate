import mongoose from 'mongoose';

export interface IDoctor extends mongoose.Document {
  name: string;
  specialty: string;
  city: string;
  price: number;
}

const DoctorSchema = new mongoose.Schema<IDoctor>({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  city: { type: String, required: true },
  price: { type: Number, required: true },
});

// We check if the model is already compiled to prevent rewriting it during hot-reloads in Next.js
export default mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema);
