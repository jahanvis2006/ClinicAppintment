const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { combineDateAndTimeIST } = require("../src/utils/time");

const prisma = new PrismaClient();

function todayISTDateStr(offsetDays = 0) {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  ist.setDate(ist.getDate() + offsetDays);
  const y = ist.getFullYear();
  const m = String(ist.getMonth() + 1).padStart(2, "0");
  const d = String(ist.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function main() {
  console.log("Seeding database...");

  await prisma.appointment.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.user.create({
    data: { name: "Demo Receptionist", email: "reception@clinicflow.test", passwordHash },
  });

  const doctors = await Promise.all([
    prisma.doctor.create({ data: { name: "Dr. Ananya Sharma", specialization: "General Physician" } }),
    prisma.doctor.create({ data: { name: "Dr. Rahul Mehta", specialization: "Cardiologist" } }),
    prisma.doctor.create({ data: { name: "Dr. Neha Jain", specialization: "Dermatologist" } }),
  ]);

  const patientNames = [
    ["Rahul Sharma", "9810000001", "rahul.sharma@example.com"],
    ["Priya Singh", "9810000002", "priya.singh@example.com"],
    ["Ankit Verma", "9810000003", "ankit.verma@example.com"],
    ["Sneha Gupta", "9810000004", "sneha.gupta@example.com"],
    ["Vikram Rao", "9810000005", "vikram.rao@example.com"],
    ["Kavita Nair", "9810000006", "kavita.nair@example.com"],
    ["Arjun Kapoor", "9810000007", "arjun.kapoor@example.com"],
    ["Meera Iyer", "9810000008", "meera.iyer@example.com"],
    ["Rohan Desai", "9810000009", "rohan.desai@example.com"],
    ["Anjali Bhatt", "9810000010", "anjali.bhatt@example.com"],
  ];

  const patients = await Promise.all(
    patientNames.map(([name, phone, email]) => prisma.patient.create({ data: { name, phone, email } }))
  );

  const today = todayISTDateStr(0);
  const tomorrow = todayISTDateStr(1);

  // Non-overlapping slots per doctor across today/tomorrow.
  const appointments = [
    // Dr. Ananya Sharma - today
    { doctor: doctors[0], patient: patients[0], date: today, start: "10:00", end: "10:30", status: "SCHEDULED" },
    { doctor: doctors[0], patient: patients[1], date: today, start: "10:30", end: "11:00", status: "SCHEDULED" },
    { doctor: doctors[0], patient: patients[2], date: today, start: "11:30", end: "12:00", status: "SCHEDULED" },
    { doctor: doctors[0], patient: patients[3], date: today, start: "15:00", end: "15:30", status: "CANCELLED", fee: 0 },
    // Dr. Rahul Mehta - today
    { doctor: doctors[1], patient: patients[4], date: today, start: "09:30", end: "10:00", status: "COMPLETED" },
    { doctor: doctors[1], patient: patients[5], date: today, start: "10:00", end: "10:30", status: "SCHEDULED" },
    { doctor: doctors[1], patient: patients[0], date: today, start: "14:00", end: "14:30", status: "SCHEDULED" },
    // Dr. Neha Jain - today
    { doctor: doctors[2], patient: patients[6], date: today, start: "11:00", end: "11:20", status: "SCHEDULED" },
    { doctor: doctors[2], patient: patients[7], date: today, start: "11:20", end: "11:40", status: "SCHEDULED" },
    // Tomorrow - a mix across doctors
    { doctor: doctors[0], patient: patients[8], date: tomorrow, start: "09:00", end: "09:30", status: "SCHEDULED" },
    { doctor: doctors[1], patient: patients[9], date: tomorrow, start: "09:00", end: "09:30", status: "SCHEDULED" },
    { doctor: doctors[2], patient: patients[1], date: tomorrow, start: "10:00", end: "10:30", status: "SCHEDULED" },
    { doctor: doctors[1], patient: patients[2], date: tomorrow, start: "11:00", end: "11:30", status: "SCHEDULED" },
    { doctor: doctors[0], patient: patients[3], date: tomorrow, start: "13:00", end: "13:30", status: "SCHEDULED" },
  ];

  for (const a of appointments) {
    const startTime = combineDateAndTimeIST(a.date, a.start);
    const endTime = combineDateAndTimeIST(a.date, a.end);
    await prisma.appointment.create({
      data: {
        doctorId: a.doctor.id,
        patientId: a.patient.id,
        startTime,
        endTime,
        status: a.status,
        cancellationFee: a.status === "CANCELLED" ? a.fee ?? 0 : 0,
      },
    });
  }

  console.log("Seed complete:");
  console.log(`  Users: 1 (reception@clinicflow.test / password123)`);
  console.log(`  Doctors: ${doctors.length}`);
  console.log(`  Patients: ${patients.length}`);
  console.log(`  Appointments: ${appointments.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
