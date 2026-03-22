import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Slot } from "@/models/Slot";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/auth";

// Create a booking (patient only)
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json(
        { error: "Моля, влезте в профила си." },
        { status: 401 }
      );
    }
    if (auth.role !== "patient") {
      return NextResponse.json(
        { error: "Само пациенти могат да запазват часове." },
        { status: 403 }
      );
    }

    const { slotId, notes } = await request.json();
    if (!slotId) {
      return NextResponse.json(
        { error: "Моля, изберете час." },
        { status: 400 }
      );
    }

    await connectDB();

    // Atomically mark slot as booked (prevents double-booking)
    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, isBooked: false },
      { isBooked: true, bookedBy: auth.userId },
      { new: true }
    );

    if (!slot) {
      return NextResponse.json(
        { error: "Този час вече е зает или не съществува." },
        { status: 409 }
      );
    }

    const booking = await Booking.create({
      patientId: auth.userId,
      doctorId: slot.doctorId,
      slotId: slot._id,
      status: "pending",
      notes: notes || "",
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Грешка при запазване на час." },
      { status: 500 }
    );
  }
}

// List bookings for current user
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json(
        { error: "Моля, влезте в профила си." },
        { status: 401 }
      );
    }

    await connectDB();

    let filter: Record<string, unknown>;

    if (auth.role === "patient") {
      filter = { patientId: auth.userId };
    } else {
      // Doctor — find their doctorProfile ID, then find bookings
      const user = await User.findById(auth.userId).lean();
      if (!user?.doctorProfile) {
        return NextResponse.json({ bookings: [] });
      }
      filter = { doctorId: user.doctorProfile };
    }

    const bookings = await Booking.find(filter)
      .populate("doctorId", "name specialty hospital city price")
      .populate("slotId", "dateTime durationMinutes")
      .populate("patientId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("List bookings error:", error);
    return NextResponse.json(
      { error: "Грешка при зареждане на часовете." },
      { status: 500 }
    );
  }
}
