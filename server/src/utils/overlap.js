// Single source of truth for the appointment-overlap rule used across the
// app (the appointments route) and the test suite, so the tests exercise the
// exact same predicate the API enforces rather than a hand-copied mirror.
//
// Two time ranges [newStart, newEnd) and [existingStart, existingEnd) are
// considered overlapping (and therefore conflicting) when:
//
//   newStart < existingEnd   AND   newEnd > existingStart
//
// Appointments that merely touch at a boundary (one ends exactly when the
// other starts) are NOT overlapping and are allowed.
function appointmentsOverlap(newStart, newEnd, existingStart, existingEnd) {
  const ns = new Date(newStart).getTime();
  const ne = new Date(newEnd).getTime();
  const es = new Date(existingStart).getTime();
  const ee = new Date(existingEnd).getTime();
  return ns < ee && ne > es;
}

module.exports = { appointmentsOverlap };
