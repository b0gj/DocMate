import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Doctor } from "@/models/Doctor";
import { Slot } from "@/models/Slot";

export async function GET(request: NextRequest) {
  await connectDB();

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search");
  const specialty = searchParams.get("specialty");
  const city = searchParams.get("city");
  const hospital = searchParams.get("hospital");
  const maxPrice = searchParams.get("maxPrice");
  const minRating = searchParams.get("minRating");
  const availableThisWeek = searchParams.get("availableThisWeek");
  const sort = searchParams.get("sort") || "rating-desc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

  // Build filter
  const filter: Record<string, unknown> = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { specialty: { $regex: search, $options: "i" } },
    ];
  }
  if (specialty) filter.specialty = specialty;
  if (city) filter.city = city;
  if (hospital) filter.hospital = hospital;
  if (maxPrice) filter.price = { $lte: parseFloat(maxPrice) };
  if (minRating) filter.rating = { $gte: parseFloat(minRating) };

  // Sort
  const sortMap: Record<string, Record<string, 1 | -1>> = {
    "price-asc": { price: 1 },
    "price-desc": { price: -1 },
    "rating-desc": { rating: -1 },
    "name-asc": { name: 1 },
  };
  const sortOption = sortMap[sort] || sortMap["rating-desc"];

  // Filter by availability this week
  if (availableThisWeek === "true") {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    const availableDoctorIds = await Slot.distinct("doctorId", {
      dateTime: { $gte: now, $lte: endOfWeek },
      isBooked: false,
    });
    filter._id = { $in: availableDoctorIds };
  }

  const [doctors, total] = await Promise.all([
    Doctor.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Doctor.countDocuments(filter),
  ]);

  // Get next available slot for each doctor
  const doctorIds = doctors.map((d) => d._id);
  const now = new Date();
  const nextSlots = await Slot.aggregate([
    {
      $match: {
        doctorId: { $in: doctorIds },
        dateTime: { $gte: now },
        isBooked: false,
      },
    },
    { $sort: { dateTime: 1 } },
    {
      $group: {
        _id: "$doctorId",
        nextSlot: { $first: "$dateTime" },
      },
    },
  ]);

  const slotMap = new Map(
    nextSlots.map((s) => [s._id.toString(), s.nextSlot])
  );

  const results = doctors.map((d) => ({
    ...d,
    nextAvailableSlot: slotMap.get(d._id.toString()) || null,
  }));

  return NextResponse.json({
    doctors: results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
