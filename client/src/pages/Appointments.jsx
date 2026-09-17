import React, { useEffect, useState, useCallback } from "react";
import { api } from "../services/api";
import Modal from "../components/Modal.jsx";
import PatientAutocomplete from "../components/PatientAutocomplete.jsx";
import { useToast } from "../components/Toast.jsx";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });
}

const emptyBookingForm = { patientId: "", doctorId: "", date: "", startTime: "", endTime: "" };

export default function Appointments() {
  const { push } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("startTime");
  const [order, setOrder] = useState("asc");
  const [page, setPage] = useState(1);

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  const [bookOpen, setBookOpen] = useState(false);
  const [bookForm, setBookForm] = useState(emptyBookingForm);
  const [bookError, setBookError] = useState("");
  const [booking, setBooking] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.listDoctors().then((d) => setDoctors(d.doctors)).catch(() => {});
    api.listPatients().then((d) => setPatients(d.patients)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (doctorId) params.set("doctorId", doctorId);
      if (date) params.set("date", date);
      if (status) params.set("status", status);
      params.set("sort", sort);
      params.set("order", order);
      params.set("page", String(page));
      params.set("limit", String(pagination.limit));

      const data = await api.listAppointments(`?${params.toString()}`);
      setAppointments(data.appointments);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, doctorId, date, status, sort, order, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, doctorId, date, status]);

  async function onBookSubmit(e) {
    e.preventDefault();
    setBookError("");
    if (!bookForm.patientId) {
      setBookError("Please select an existing patient from the list.");
      return;
    }
    setBooking(true);
    try {
      await api.createAppointment(bookForm);
      push("Appointment booked successfully.");
      setBookOpen(false);
      setBookForm(emptyBookingForm);
      setPage(1);
      load();
    } catch (err) {
      setBookError(err.message);
    } finally {
      setBooking(false);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const result = await api.cancelAppointment(cancelTarget.id);
      push(
        result.cancellationFee > 0
          ? `Late cancellation — fee: ₹${result.cancellationFee}`
          : "Cancelled — no fee (free cancellation)."
      );
      setCancelTarget(null);
      load();
    } catch (err) {
      push(err.message, "error");
    } finally {
      setCancelling(false);
    }
  }

  function toggleSort(field) {
    if (sort === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setOrder("asc");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Appointments</h1>
        <button className="btn btn-primary" onClick={() => setBookOpen(true)}>+ Book Appointment</button>
      </div>

      <div className="card p-4 mb-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <input
          className="input"
          placeholder="Search patient by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value="">All Doctors</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          className="input"
          value={`${sort}:${order}`}
          onChange={(e) => {
            const [s, o] = e.target.value.split(":");
            setSort(s);
            setOrder(o);
          }}
        >
          <option value="startTime:asc">Appointment Time (earliest first)</option>
          <option value="startTime:desc">Appointment Time (latest first)</option>
          <option value="patientName:asc">Patient Name (A-Z)</option>
          <option value="patientName:desc">Patient Name (Z-A)</option>
          <option value="createdAt:desc">Newest</option>
        </select>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort("patientName")}>Patient</th>
              <th className="px-4 py-3 font-medium">Doctor</th>
              <th className="px-4 py-3 font-medium">Specialization</th>
              <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort("startTime")}>Date</th>
              <th className="px-4 py-3 font-medium">Start</th>
              <th className="px-4 py-3 font-medium">End</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Fee</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">No appointments match your filters.</td></tr>
            ) : (
              appointments.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{a.patient.name}</td>
                  <td className="px-4 py-3 text-slate-700">{a.doctor.name}</td>
                  <td className="px-4 py-3 text-slate-500">{a.doctor.specialization}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(a.startTime)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatTime(a.startTime)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatTime(a.endTime)}</td>
                  <td className="px-4 py-3"><span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span></td>
                  <td className="px-4 py-3 text-slate-600">{a.status === "CANCELLED" ? `₹${a.cancellationFee}` : "—"}</td>
                  <td className="px-4 py-3">
                    {a.status === "SCHEDULED" ? (
                      <button className="text-red-600 hover:text-red-800 font-medium" onClick={() => setCancelTarget(a)}>
                        Cancel
                      </button>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && pagination.total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === pagination.totalPages)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "..." ? (
                  <span key={`e${idx}`} className="px-2 text-slate-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      p === page ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              className="btn btn-secondary"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Book appointment modal */}
      <Modal
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        title="Book Appointment"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setBookOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="book-form" disabled={booking}>
              {booking ? "Booking..." : "Book"}
            </button>
          </>
        }
      >
        <form id="book-form" onSubmit={onBookSubmit} className="space-y-4">
          {bookError && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">{bookError}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
            <PatientAutocomplete
              patients={patients}
              value={bookForm.patientId}
              onChange={(patientId) => setBookForm({ ...bookForm, patientId })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Doctor</label>
            <select className="input" required value={bookForm.doctorId}
              onChange={(e) => setBookForm({ ...bookForm, doctorId: e.target.value })}>
              <option value="">Select doctor</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input className="input" type="date" required value={bookForm.date}
              onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start time</label>
              <input className="input" type="time" required value={bookForm.startTime}
                onChange={(e) => setBookForm({ ...bookForm, startTime: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End time</label>
              <input className="input" type="time" required value={bookForm.endTime}
                onChange={(e) => setBookForm({ ...bookForm, endTime: e.target.value })} />
            </div>
          </div>
        </form>
      </Modal>

      {/* Cancel confirmation modal */}
      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Appointment?"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCancelTarget(null)}>Keep appointment</button>
            <button className="btn btn-danger" onClick={confirmCancel} disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Confirm cancellation"}
            </button>
          </>
        }
      >
        {cancelTarget && (
          <div className="space-y-2 text-sm">
            <p><span className="text-slate-500">Patient:</span> <span className="font-medium">{cancelTarget.patient.name}</span></p>
            <p><span className="text-slate-500">Doctor:</span> <span className="font-medium">{cancelTarget.doctor.name}</span></p>
            <p><span className="text-slate-500">Appointment:</span> {formatDate(cancelTarget.startTime)}, {formatTime(cancelTarget.startTime)}</p>
            <div className="bg-amber-50 text-amber-800 rounded-lg px-3 py-2 mt-3">
              The cancellation fee is calculated by the server based on how much notice is given
              (free if more than 2 hours before the appointment, ₹200 otherwise) and will be shown
              after you confirm.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}