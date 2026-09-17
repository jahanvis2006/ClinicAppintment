// Cancellation policy:
//  - More than 2 hours before appointment start  -> FREE (₹0)
//  - 2 hours or less before appointment start     -> LATE (₹200)
//  - Appointment start time already passed        -> cannot be normally cancelled
const LATE_CANCELLATION_FEE = 200;
const FREE_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

function evaluateCancellation(appointmentStart, now = new Date()) {
  const start = new Date(appointmentStart);
  const msRemaining = start.getTime() - now.getTime();

  if (msRemaining <= 0) {
    return { alreadyStarted: true, type: null, fee: 0 };
  }
  if (msRemaining > FREE_WINDOW_MS) {
    return { alreadyStarted: false, type: "EARLY", fee: 0 };
  }
  return { alreadyStarted: false, type: "LATE", fee: LATE_CANCELLATION_FEE };
}

// Single source of truth for "is this appointment allowed to be cancelled
// right now, and if so, what fee applies?" Encapsulates every rejection
// reason (already cancelled, already completed, already started) alongside
// the fee calculation, so the route stays a thin wrapper and the whole
// decision is unit-testable without a database.
function canCancel(appointment, now = new Date()) {
  if (appointment.status === "CANCELLED") {
    return { allowed: false, reason: "ALREADY_CANCELLED", message: "Appointment is already cancelled." };
  }
  if (appointment.status === "COMPLETED") {
    return { allowed: false, reason: "ALREADY_COMPLETED", message: "Completed appointments cannot be cancelled." };
  }

  const result = evaluateCancellation(appointment.startTime, now);
  if (result.alreadyStarted) {
    return {
      allowed: false,
      reason: "ALREADY_STARTED",
      message: "This appointment has already started and cannot be cancelled normally.",
    };
  }

  return { allowed: true, type: result.type, fee: result.fee };
}

module.exports = { evaluateCancellation, canCancel, LATE_CANCELLATION_FEE, FREE_WINDOW_MS };
