import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Doctor } from "@/models/Doctor";
import { Slot } from "@/models/Slot";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Невалидно ID" }, { status: 400 });
  }

  const doctor = await Doctor.findById(id).lean();
  if (!doctor) {
    return NextResponse.json({ error: "Лекарят не е намерен" }, { status: 404 });
  }

  const now = new Date();
  const slots = await Slot.find({
    doctorId: id,
    dateTime: { $gte: now },
    isBooked: false,
  })
    .sort({ dateTime: 1 })
    .limit(50)
    .lean();

  return NextResponse.json({ doctor, slots });
}
