import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import Modal from "../components/Modal.jsx";
import { useToast } from "../components/Toast.jsx";

export default function Doctors() {
  const { push } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", specialization: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.listDoctors();
      setDoctors(data.doctors);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createDoctor(form);
      push("Doctor added successfully.");
      setOpen(false);
      setForm({ name: "", specialization: "" });
      load();
    } catch (err) {
      push(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Doctors</h1>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Add Doctor</button>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Specialization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={2} className="px-5 py-6 text-center text-slate-500">Loading...</td></tr>
            ) : doctors.length === 0 ? (
              <tr><td colSpan={2} className="px-5 py-6 text-center text-slate-500">No doctors yet.</td></tr>
            ) : (
              doctors.map((d) => (
                <tr key={d.id}>
                  <td className="px-5 py-3 font-medium text-slate-800">{d.name}</td>
                  <td className="px-5 py-3 text-slate-600">{d.specialization}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Doctor"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="doctor-form" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        <form id="doctor-form" onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input className="input" placeholder="Dr. Jane Doe" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
            <input className="input" placeholder="General Physician" value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })} required />
          </div>
        </form>
      </Modal>
    </div>
  );
}
