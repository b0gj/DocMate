import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Doctor } from "@/models/Doctor";
import { hashPassword, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, phone, city, specialty, hospital, price, bio, workingHours } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "Моля, попълнете всички задължителни полета." },
        { status: 400 }
      );
    }

    if (!["patient", "doctor"].includes(role)) {
      return NextResponse.json(
        { error: "Невалидна роля." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Паролата трябва да е поне 6 символа." },
        { status: 400 }
      );
    }

    if (role === "doctor" && (!specialty || !hospital || !price)) {
      return NextResponse.json(
        { error: "Лекарите трябва да посочат специалност, болница и цена." },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Потребител с този имейл вече съществува." },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    let doctorProfile = undefined;

    if (role === "doctor") {
      const doctor = await Doctor.create({
        name,
        specialty,
        city: city || "София",
        hospital,
        price: Number(price),
        rating: 0,
        bio: bio || "",
        workingHours: workingHours || "09:00 - 17:00",
        phone: phone || "",
      });
      doctorProfile = doctor._id;
    }

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role,
      phone,
      city,
      doctorProfile,
    });

    await setAuthCookie({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Грешка при регистрация. Опитайте отново." },
      { status: 500 }
    );
  }
}
