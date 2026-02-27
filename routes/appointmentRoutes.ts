import express from "express";

const router = express.Router();

// In-memory storage (for now) - in production use database
let appointments = [];

// GET all appointments
router.get("/", (req, res) => {
    try {
        console.log("📅 Fetching appointments from backend...");
        res.json({
            success: true,
            appointments,
            count: appointments.length
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// GET upcoming appointments
router.get("/upcoming", (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];
        const upcoming = appointments.filter(
            apt => apt.date >= today && apt.status === "upcoming"
        );
        res.json({
            success: true,
            appointments: upcoming
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// POST - Add appointment
router.post("/", (req, res) => {
    try {
        const { date, time, doctorName, doctorSpecialty, reminderMinutes, notes } = req.body;

        if (!date || !time || !doctorName) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const appointment = {
            id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date,
            time,
            doctorName,
            doctorSpecialty,
            reminderMinutes,
            notes: notes || "",
            status: "upcoming",
            created_at: new Date().toISOString()
        };

        appointments.push(appointment);
        console.log("✅ Appointment added:", appointment.id);

        res.status(201).json({
            success: true,
            appointment
        });
    } catch (error: any) {
        console.error("❌ Error adding appointment:", error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Remove appointment
router.delete("/:id", (req, res) => {
    try {
        const { id } = req.params;
        const index = appointments.findIndex(apt => apt.id === id);

        if (index === -1) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        appointments.splice(index, 1);
        console.log("🗑️  Appointment deleted:", id);

        res.json({
            success: true,
            message: "Appointment deleted"
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT - Update appointment status
router.put("/:id/status", (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["upcoming", "completed", "cancelled"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const appointment = appointments.find(apt => apt.id === id);
        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        appointment.status = status;
        console.log("🔄 Appointment status updated:", id, status);

        res.json({
            success: true,
            appointment
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Check for reminders
router.get("/reminders", (req, res) => {
    try {
        const now = new Date();
        const reminders = appointments.filter(apt => {
            const aptDateTime = new Date(`${apt.date}T${apt.time}`);
            const timeUntil = aptDateTime.getTime() - now.getTime();
            const reminderTime = apt.reminderMinutes * 60 * 1000;
            return timeUntil > 0 && timeUntil <= reminderTime && apt.status === "upcoming";
        });

        res.json({
            success: true,
            reminders,
            count: reminders.length
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
