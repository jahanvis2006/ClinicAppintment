import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import Modal from "../components/Modal.jsx";
import { useToast } from "../components/Toast.jsx";

export default function Patients() {
  const { push } = useToast();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);

  async function load(q = "") {
    setLoading(true);
    setError("");
    try {
      const data = await api.listPatients(q ? `?search=${encodeURIComponent(q)}` : "");
      setPatients(data.patients);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createPatient(form);
      push("Patient added successfully.");
      setOpen(false);
      setForm({ name: "", phone: "", email: "" });
      load(search);
    } catch (err) {
      push(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Patients</h1>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Add Patient</button>
      </div>

      <div className="mb-4 max-w-sm">
        <input className="input" placeholder="Search patients by name..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={3} className="px-5 py-6 text-center text-slate-500">Loading...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan={3} className="px-5 py-6 text-center text-slate-500">No patients found.</td></tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-5 py-3 text-slate-600">{p.phone}</td>
                  <td className="px-5 py-3 text-slate-600">{p.email || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Patient"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="patient-form" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        <form id="patient-form" onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email (optional)</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
