const express = require("express");
const prisma = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// GET /api/doctors
router.get("/", async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = search
      ? { name: { contains: String(search) } }
      : {};
    const doctors = await prisma.doctor.findMany({ where, orderBy: { name: "asc" } });
    res.json({ doctors });
  } catch (err) {
    next(err);
  }
});

// POST /api/doctors
router.post("/", async (req, res, next) => {
  try {
    const { name, specialization } = req.body;
    if (!name || !specialization) {
      return res.status(400).json({ message: "Name and specialization are required." });
    }
    const doctor = await prisma.doctor.create({ data: { name, specialization } });
    res.status(201).json({ doctor });
  } catch (err) {
    next(err);
  }
});

// GET /api/doctors/:id
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid doctor id." });
    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) return res.status(404).json({ message: "Doctor not found." });
    res.json({ doctor });
  } catch (err) {
    next(err);
  }
});

// GET /api/doctors/:id/schedule?date=YYYY-MM-DD
router.get("/:id/schedule", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { date } = req.query;
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid doctor id." });
    if (!date) return res.status(400).json({ message: "date query param (YYYY-MM-DD) is required." });

    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) return res.status(404).json({ message: "Doctor not found." });

    const { getISTDayRange } = require("../utils/time");
    const range = getISTDayRange(date);
    if (!range) return res.status(400).json({ message: "Invalid date." });

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: id,
        // Exclusive upper bound (next-day 00:00 IST) so an appointment
        // starting in the last minute of the day is never dropped.
        startTime: { gte: range.start, lt: range.end },
        status: { not: "CANCELLED" },
      },
      include: { patient: true },
      orderBy: { startTime: "asc" },
    });

    res.json({ doctor, date, appointments });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
