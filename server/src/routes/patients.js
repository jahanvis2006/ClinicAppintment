const express = require("express");
const prisma = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// GET /api/patients
router.get("/", async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = search ? { name: { contains: String(search) } } : {};
    const patients = await prisma.patient.findMany({ where, orderBy: { name: "asc" } });
    res.json({ patients });
  } catch (err) {
    next(err);
  }
});

// POST /api/patients
router.post("/", async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required." });
    }
    const patient = await prisma.patient.create({ data: { name, phone, email: email || null } });
    res.status(201).json({ patient });
  } catch (err) {
    next(err);
  }
});

// GET /api/patients/:id
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid patient id." });
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) return res.status(404).json({ message: "Patient not found." });
    res.json({ patient });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
