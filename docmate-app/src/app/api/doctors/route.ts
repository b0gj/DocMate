import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';

export async function GET() {
  try {
    await dbConnect();
    // Fetch all doctors from the DB
    const doctors = await Doctor.find({});
    return NextResponse.json({ success: true, data: doctors });
  } catch (error: any) {
    // Return error if DB doesn't connect or model fails
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const doctor = await Doctor.create(body);
    return NextResponse.json({ success: true, data: doctor }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
