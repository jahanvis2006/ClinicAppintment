import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Searchable "type a name, pick an existing patient" field.
 *
 * Fully controlled on `value` (the patientId — same value the plain
 * <select> used to hold), so it's a drop-in replacement: the parent still
 * owns patientId and nothing about validation/submission needs to change.
 *
 * Typing never sets patientId to free text. patientId is only ever set to
 * a real patient's id, on click/Enter of a suggestion. If the person edits
 * the text away from an exact match, the selection is cleared, so an
 * unmatched/arbitrary name can never be submitted.
 */
export default function PatientAutocomplete({
  patients,
  value,
  onChange,
  placeholder = "Search patient by name...",
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef(null);

  const selectedPatient = useMemo(
    () => patients.find((p) => String(p.id) === String(value)) || null,
    [patients, value]
  );

  // Keep the displayed text in sync whenever the selection changes from
  // outside this component (form reset after booking, modal reopened, etc).
  useEffect(() => {
    setQuery(selectedPatient ? selectedPatient.name : "");
  }, [selectedPatient]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients.slice(0, 8);
    return patients.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [patients, query]);

  function selectPatient(p) {
    onChange(String(p.id));
    setQuery(p.name);
    setOpen(false);
  }

  function handleInputChange(e) {
    const text = e.target.value;
    setQuery(text);
    setHighlighted(0);
    setOpen(true);
    // Text no longer matches the selected patient's name -> the selection
    // is no longer valid, so clear patientId until a real one is (re)picked.
    if (!selectedPatient || text !== selectedPatient.name) {
      onChange("");
    }
  }

  function handleBlur() {
    // Let a click on an option register (via onMouseDown) before we close.
    setTimeout(() => {
      setOpen(false);
      // Don't leave arbitrary unmatched text sitting in the box.
      if (!selectedPatient) setQuery("");
    }, 100);
  }

  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (matches[highlighted]) {
        e.preventDefault();
        selectPatient(matches[highlighted]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        className="input"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      {open && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg text-sm">
          {matches.map((p, idx) => (
            <li
              key={p.id}
              onMouseDown={(e) => e.preventDefault()} // keep focus so blur doesn't fire first
              onClick={() => selectPatient(p)}
              className={`px-3 py-2 cursor-pointer ${
                idx === highlighted ? "bg-brand-50 text-brand-700" : "hover:bg-slate-50"
              }`}
            >
              <span className="font-medium">{p.name}</span>
              {p.phone && <span className="text-slate-400"> — {p.phone}</span>}
            </li>
          ))}
        </ul>
      )}

      {open && query && matches.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg text-sm px-3 py-2 text-slate-500">
          No matching patient. Add them on the Patients page first.
        </div>
      )}
    </div>
  );
}