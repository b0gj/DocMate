import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Slot } from "@/models/Slot";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/auth";

// Update booking status (cancel or confirm)
export async function PATCH(
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

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Невалидно ID." },
        { status: 400 }
      );
    }

    const { status } = await request.json();
    if (!["confirmed", "cancelled"].includes(status)) {
      return NextResponse.json(
        { error: "Невалиден статус." },
        { status: 400 }
      );
    }

    await connectDB();

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json(
        { error: "Резервацията не е намерена." },
        { status: 404 }
      );
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Тази резервация вече е отменена." },
        { status: 400 }
      );
    }

    // Authorization: patient can cancel their own, doctor can confirm/cancel theirs
    if (auth.role === "patient") {
      if (booking.patientId.toString() !== auth.userId) {
        return NextResponse.json(
          { error: "Нямате достъп до тази резервация." },
          { status: 403 }
        );
      }
      if (status !== "cancelled") {
        return NextResponse.json(
          { error: "Пациентите могат само да отменят резервации." },
          { status: 403 }
        );
      }
    } else {
      const user = await User.findById(auth.userId).lean();
      if (!user?.doctorProfile || booking.doctorId.toString() !== user.doctorProfile.toString()) {
        return NextResponse.json(
          { error: "Нямате достъп до тази резервация." },
          { status: 403 }
        );
      }
    }

    booking.status = status;
    if (status === "cancelled") {
      booking.cancelledBy = auth.role;
    }
    await booking.save();

    // If cancelled, free the slot
    if (status === "cancelled") {
      await Slot.findByIdAndUpdate(booking.slotId, {
        isBooked: false,
        bookedBy: null,
      });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json(
      { error: "Грешка при обновяване на резервацията." },
      { status: 500 }
    );
  }
}
