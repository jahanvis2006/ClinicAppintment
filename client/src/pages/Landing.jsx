import React from "react";
import { Link } from "react-router-dom";

const features = [
  { title: "Conflict-free booking", desc: "The backend rejects any appointment that would overlap an existing one for the same doctor — no double-bookings, ever." },
  { title: "Doctor daily schedule", desc: "See any doctor's full day at a glance, so the front desk always knows who is free and when." },
  { title: "Instant patient search", desc: "Find a patient's appointment by name in seconds, even in a busy multi-doctor clinic." },
  { title: "Fair cancellations", desc: "Cancel more than 2 hours ahead and it's free. Cancel later and a small, transparent fee applies automatically." },
  { title: "Full appointment management", desc: "Book, filter, sort, paginate and cancel appointments from one clean dashboard." },
];

const audience = ["Clinic receptionists", "Front-desk staff", "Small clinics", "Clinic administrators"];
const roadmap = [
  "Automated SMS/email appointment reminders",
  "Patient self-service online booking",
  "Doctor availability / working-hours management",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-semibold text-brand-700 text-lg">ClinicFlow</span>
          <div className="flex gap-3">
            <Link to="/login" className="btn btn-secondary">Login</Link>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">ClinicFlow</h1>
        <p className="mt-4 text-xl text-brand-700 font-medium">Conflict-free clinic appointment scheduling.</p>
        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
          A front-desk appointment management system for small clinics. ClinicFlow makes sure no doctor is
          ever double-booked, and it handles cancellation fees fairly and automatically.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/register" className="btn btn-primary px-6 py-3 text-base">Get Started</Link>
          <Link to="/login" className="btn btn-secondary px-6 py-3 text-base">Login</Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-semibold text-slate-900 mb-8 text-center">Key features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card p-6">
              <h3 className="font-semibold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Who it's for</h2>
            <ul className="space-y-2">
              {audience.map((a) => (
                <li key={a} className="flex items-center gap-2 text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> {a}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">How it helps</h2>
            <p className="text-slate-600">
              Front desks juggling multiple doctors often double-book by accident, or struggle to find a
              patient's appointment quickly. ClinicFlow's backend enforces scheduling rules so overlaps are
              structurally impossible, gives instant patient-name search, and calculates cancellation fees
              transparently — so nobody has to remember the policy or do the math by hand.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-slate-900 mb-8 text-center">What's next</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {roadmap.map((r) => (
            <div key={r} className="card p-6 text-center">
              <p className="text-sm text-slate-700">{r}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        ClinicFlow — built for the Builder Round assessment.
      </footer>
    </div>
  );
}
