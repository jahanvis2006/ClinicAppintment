import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

function todayStr() {
  const d = new Date();
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ today: 0, scheduled: 0, cancelled: 0, doctors: 0, patients: 0 });
  const [todaysAppointments, setTodaysAppointments] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const date = todayStr();
        const [todayRes, scheduledRes, cancelledRes, doctorsRes, patientsRes] = await Promise.all([
          api.listAppointments(`?date=${date}&limit=50&sort=startTime&order=asc`),
          api.listAppointments(`?status=SCHEDULED&limit=1`),
          api.listAppointments(`?status=CANCELLED&limit=1`),
          api.listDoctors(),
          api.listPatients(),
        ]);
        setStats({
          today: todayRes.pagination.total,
          scheduled: scheduledRes.pagination.total,
          cancelled: cancelledRes.pagination.total,
          doctors: doctorsRes.doctors.length,
          patients: patientsRes.patients.length,
        });
        setTodaysAppointments(todayRes.appointments);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    { label: "Today's appointments", value: stats.today },
    { label: "Scheduled", value: stats.scheduled },
    { label: "Cancelled", value: stats.cancelled },
    { label: "Doctors", value: stats.doctors },
    { label: "Patients", value: stats.patients },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <div className="flex gap-3">
          <Link to="/appointments" className="btn btn-primary">Book Appointment</Link>
          <Link to="/patients" className="btn btn-secondary">Add Patient</Link>
          <Link to="/doctors" className="btn btn-secondary">Add Doctor</Link>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="text-3xl font-semibold text-slate-900 mt-1">{loading ? "…" : c.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">Today's appointments</h2>
        </div>
        {loading ? (
          <p className="p-5 text-slate-500 text-sm">Loading...</p>
        ) : todaysAppointments.length === 0 ? (
          <p className="p-5 text-slate-500 text-sm">No appointments today.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {todaysAppointments.map((a) => (
              <li key={a.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-slate-800">{a.patient.name}</span>
                  <span className="text-slate-400"> with </span>
                  <span className="text-slate-700">{a.doctor.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">
                    {new Date(a.startTime).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
