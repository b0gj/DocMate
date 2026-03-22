import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Slot } from "@/models/Slot";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/auth";

// Doctor generates new slots for their profile
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json(
        { error: "Моля, влезте в профила си." },
        { status: 401 }
      );
    }
    if (auth.role !== "doctor") {
      return NextResponse.json(
        { error: "Само лекари могат да генерират часове." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Невалидно ID." },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify this doctor owns this profile
    const user = await User.findById(auth.userId).lean();
    if (!user?.doctorProfile || user.doctorProfile.toString() !== id) {
      return NextResponse.json(
        { error: "Нямате достъп до този профил." },
        { status: 403 }
      );
    }

    const { startDate, endDate, startHour, endHour, slotDuration } =
      await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Моля, изберете начална и крайна дата." },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const hourStart = startHour ?? 9;
    const hourEnd = endHour ?? 17;
    const duration = slotDuration ?? 30;

    if (end < start) {
      return NextResponse.json(
        { error: "Крайната дата трябва да е след началната." },
        { status: 400 }
      );
    }

    // Max 30 days range
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 30) {
      return NextResponse.json(
        { error: "Максимален период: 30 дни." },
        { status: 400 }
      );
    }

    const slots = [];
    const current = new Date(start);
    const now = new Date();

    while (current <= end) {
      const dayOfWeek = current.getDay();
      // Skip weekends
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        for (let hour = hourStart; hour < hourEnd; hour++) {
          for (let min = 0; min < 60; min += duration) {
            const dateTime = new Date(current);
            dateTime.setHours(hour, min, 0, 0);

            // Skip past times
            if (dateTime <= now) continue;

            slots.push({
              doctorId: new mongoose.Types.ObjectId(id),
              dateTime,
              durationMinutes: duration,
              isBooked: false,
            });
          }
        }
      }
      current.setDate(current.getDate() + 1);
    }

    if (slots.length === 0) {
      return NextResponse.json(
        { error: "Няма валидни часове за генериране в избрания период." },
        { status: 400 }
      );
    }

    // Remove existing unbooked slots in the range to avoid duplicates
    await Slot.deleteMany({
      doctorId: id,
      dateTime: { $gte: start, $lte: end },
      isBooked: false,
    });

    const created = await Slot.insertMany(slots);

    return NextResponse.json(
      { message: `Генерирани ${created.length} часа.`, count: created.length },
      { status: 201 }
    );
  } catch (error) {
    console.error("Generate slots error:", error);
    return NextResponse.json(
      { error: "Грешка при генериране на часове." },
      { status: 500 }
    );
  }
}
