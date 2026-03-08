import mongoose from "mongoose";
import { Doctor } from "../models/Doctor";
import { Slot } from "../models/Slot";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/docmate";

const doctors = [
  {
    name: "Д-р Иван Петров",
    specialty: "Кардиолог",
    city: "София",
    hospital: "УМБАЛ Александровска",
    price: 80,
    rating: 4.8,
    imageUrl: "/doctors/doctor1.jpg",
    bio: "Специалист по сърдечно-съдови заболявания с над 15 години опит. Завършил Медицински университет — София.",
    workingHours: "Пон-Пет: 08:00–16:00",
    phone: "+359 2 921 1234",
  },
  {
    name: "Д-р Мария Георгиева",
    specialty: "Невролог",
    city: "Пловдив",
    hospital: "УМБАЛ Свети Георги",
    price: 70,
    rating: 4.6,
    imageUrl: "/doctors/doctor2.jpg",
    bio: "Експерт в диагностика и лечение на неврологични заболявания. Специализация в Германия.",
    workingHours: "Пон-Пет: 09:00–17:00",
    phone: "+359 32 602 345",
  },
  {
    name: "Д-р Георги Димитров",
    specialty: "Дерматолог",
    city: "Варна",
    hospital: "МБАЛ Свети Марина",
    price: 60,
    rating: 4.5,
    imageUrl: "/doctors/doctor3.jpg",
    bio: "Кожен специалист с фокус върху алергологията и козметичната дерматология.",
    workingHours: "Пон-Съб: 10:00–18:00",
    phone: "+359 52 978 456",
  },
  {
    name: "Д-р Елена Стоянова",
    specialty: "Ортопед",
    city: "Бургас",
    hospital: "МБАЛ Бургас",
    price: 90,
    rating: 4.9,
    imageUrl: "/doctors/doctor4.jpg",
    bio: "Ортопед-травматолог, специалист по ставни заболявания и спортни травми.",
    workingHours: "Пон-Пет: 08:30–16:30",
    phone: "+359 56 810 567",
  },
  {
    name: "Д-р Николай Иванов",
    specialty: "Офталмолог",
    city: "София",
    hospital: 'Очна болница "Зрение"',
    price: 75,
    rating: 4.7,
    imageUrl: "/doctors/doctor5.jpg",
    bio: "Очен лекар с опит в лазерна хирургия и лечение на катаракта.",
    workingHours: "Пон-Пет: 09:00–17:00",
    phone: "+359 2 843 678",
  },
  {
    name: "Д-р Анна Василева",
    specialty: "Гастроентеролог",
    city: "Пловдив",
    hospital: "УМБАЛ Свети Георги",
    price: 85,
    rating: 4.4,
    imageUrl: "/doctors/doctor6.jpg",
    bio: "Специалист по заболявания на храносмилателната система. Извършва ендоскопски процедури.",
    workingHours: "Пон-Пет: 08:00–15:00",
    phone: "+359 32 602 789",
  },
  {
    name: "Д-р Петър Тодоров",
    specialty: "Педиатър",
    city: "София",
    hospital: 'СБАЛДБ "Проф. Иван Митев"',
    price: 50,
    rating: 4.8,
    imageUrl: "/doctors/doctor7.jpg",
    bio: "Детски лекар с 20 години опит. Грижи за деца от раждането до 18-годишна възраст.",
    workingHours: "Пон-Съб: 08:00–19:00",
    phone: "+359 2 815 890",
  },
  {
    name: "Д-р Стефан Колев",
    specialty: "Уролог",
    city: "Варна",
    hospital: "МБАЛ Свети Марина",
    price: 95,
    rating: 4.3,
    imageUrl: "/doctors/doctor8.jpg",
    bio: "Уролог с опит в минимално инвазивна хирургия и лечение на бъбречни заболявания.",
    workingHours: "Пон-Пет: 09:00–16:00",
    phone: "+359 52 978 901",
  },
  {
    name: "Д-р Десислава Маринова",
    specialty: "Ендокринолог",
    city: "Бургас",
    hospital: "МБАЛ Бургас",
    price: 65,
    rating: 4.6,
    imageUrl: "/doctors/doctor9.jpg",
    bio: "Специалист по хормонални нарушения, диабет и заболявания на щитовидната жлеза.",
    workingHours: "Пон-Пет: 10:00–18:00",
    phone: "+359 56 810 012",
  },
  {
    name: "Д-р Христо Благоев",
    specialty: "Пулмолог",
    city: "София",
    hospital: 'СБАЛББ "Света София"',
    price: 70,
    rating: 4.5,
    imageUrl: "/doctors/doctor10.jpg",
    bio: "Белодробен специалист с фокус върху астма, ХОББ и дихателни алергии.",
    workingHours: "Пон-Пет: 08:00–16:00",
    phone: "+359 2 832 123",
  },
];

function generateSlots(doctorId: mongoose.Types.ObjectId) {
  const slots = [];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  startOfWeek.setHours(9, 0, 0, 0);

  for (let day = 0; day < 5; day++) {
    for (let hour = 9; hour < 17; hour++) {
      const dateTime = new Date(startOfWeek);
      dateTime.setDate(startOfWeek.getDate() + day);
      dateTime.setHours(hour, 0, 0, 0);

      // Skip past slots
      if (dateTime < now) continue;

      slots.push({
        doctorId,
        dateTime,
        durationMinutes: 30,
        isBooked: Math.random() < 0.3, // ~30% booked
      });

      // Add :30 slot
      const halfHourSlot = new Date(dateTime);
      halfHourSlot.setMinutes(30);
      if (halfHourSlot > now) {
        slots.push({
          doctorId,
          dateTime: halfHourSlot,
          durationMinutes: 30,
          isBooked: Math.random() < 0.3,
        });
      }
    }
  }
  return slots;
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  await Doctor.deleteMany({});
  await Slot.deleteMany({});
  console.log("Cleared existing data");

  const createdDoctors = await Doctor.insertMany(doctors);
  console.log(`Inserted ${createdDoctors.length} doctors`);

  let totalSlots = 0;
  for (const doc of createdDoctors) {
    const slots = generateSlots(doc._id as mongoose.Types.ObjectId);
    if (slots.length > 0) {
      await Slot.insertMany(slots);
      totalSlots += slots.length;
    }
  }
  console.log(`Inserted ${totalSlots} slots`);

  await mongoose.disconnect();
  console.log("Done!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
