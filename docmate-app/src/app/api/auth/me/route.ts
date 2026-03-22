import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json(
        { error: "Не сте влезли в профила си." },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(auth.userId)
      .select("-password")
      .populate("doctorProfile")
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "Потребителят не е намерен." },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Грешка при зареждане на профила." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json(
        { error: "Не сте влезли в профила си." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, city } = body;

    await connectDB();

    const user = await User.findByIdAndUpdate(
      auth.userId,
      { name, phone, city },
      { new: true, runValidators: true }
    )
      .select("-password")
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "Потребителят не е намерен." },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Грешка при обновяване на профила." },
      { status: 500 }
    );
  }
}
