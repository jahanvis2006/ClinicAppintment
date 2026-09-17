import React, { useEffect, useState } from "react";
import { api } from "../services/api";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });
}
function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}
function formatHeaderDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

export default function DoctorSchedule() {
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [schedule, setSchedule] = useState(null);

  useEffect(() => {
    api.listDoctors().then((d) => {
      setDoctors(d.doctors);
      if (d.doctors.length > 0) setDoctorId(String(d.doctors[0].id));
    });
  }, []);

  useEffect(() => {
    if (!doctorId || !date) return;
    setLoading(true);
    setError("");
    api
      .getDoctorSchedule(doctorId, date)
      .then(setSchedule)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [doctorId, date]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Doctor Schedule</h1>

      <div className="card p-4 mb-4 grid sm:grid-cols-2 gap-3 max-w-xl">
        <select className="input" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>
          ))}
        </select>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <div className="card p-6 max-w-2xl">
        {schedule && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800">{schedule.doctor.name}</h2>
            <p className="text-sm text-slate-500">{formatHeaderDate(date)}</p>
          </div>
        )}

        {loading ? (
          <p className="text-slate-500 text-sm">Loading schedule...</p>
        ) : !schedule || schedule.appointments.length === 0 ? (
          <p className="text-slate-500 text-sm">No appointments booked for this doctor on this date.</p>
        ) : (
          <ol className="relative border-l border-slate-200 ml-2">
            {schedule.appointments.map((a) => (
              <li key={a.id} className="mb-6 ml-4">
                <div className="absolute w-2.5 h-2.5 bg-brand-500 rounded-full mt-1.5 -left-1.25 border border-white" />
                <time className="text-xs font-medium text-slate-500">{formatTime(a.startTime)} – {formatTime(a.endTime)}</time>
                <p className="text-sm font-medium text-slate-800">{a.patient.name}</p>
                <span className={`badge badge-${a.status.toLowerCase()} mt-1`}>{a.status}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
