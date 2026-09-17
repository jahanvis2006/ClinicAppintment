const test = require("node:test");
const assert = require("node:assert");
const { appointmentsOverlap } = require("../src/utils/overlap");

// Helper: build a same-day Date from "HH:mm" (arbitrary fixed date, only the
// relative offsets matter for these tests).
function t(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2026, 0, 1, h, m, 0, 0);
}

test("generic: overlapping appointment is rejected", () => {
  assert.strictEqual(appointmentsOverlap(t("10:20"), t("10:50"), t("10:00"), t("10:30")), true);
});

test("generic: touching boundary (new starts exactly when existing ends) is allowed", () => {
  assert.strictEqual(appointmentsOverlap(t("10:30"), t("11:00"), t("10:00"), t("10:30")), false);
});

test("generic: fully-contained overlap is rejected", () => {
  assert.strictEqual(appointmentsOverlap(t("10:30"), t("11:30"), t("10:00"), t("11:00")), true);
});

test("generic: touching boundary (new ends exactly when existing starts) is allowed", () => {
  assert.strictEqual(appointmentsOverlap(t("09:00"), t("10:00"), t("10:00"), t("11:00")), false);
});

// --- Exact scenarios from the Builder Round assignment (A, C, F, G, H;
// B, D, E involve status/doctor-id/date logic that lives in the route and
// are covered by the manual test plan / route-level reasoning in the report) ---

test("A. existing 10:00-10:30, new 10:15-10:45 -> conflict", () => {
  assert.strictEqual(appointmentsOverlap(t("10:15"), t("10:45"), t("10:00"), t("10:30")), true);
});

test("C. existing 10:00-11:00, new 10:30-11:30 -> conflict", () => {
  assert.strictEqual(appointmentsOverlap(t("10:30"), t("11:30"), t("10:00"), t("11:00")), true);
});

test("F. existing 10:00-11:00, new 09:00-10:00 -> no conflict (back-to-back before)", () => {
  assert.strictEqual(appointmentsOverlap(t("09:00"), t("10:00"), t("10:00"), t("11:00")), false);
});

test("G. existing 10:00-11:00, new 09:30-10:00 -> no conflict (ends exactly at existing start)", () => {
  assert.strictEqual(appointmentsOverlap(t("09:30"), t("10:00"), t("10:00"), t("11:00")), false);
});

test("H. existing 10:00-11:00, new 11:00-11:30 -> no conflict (back-to-back after)", () => {
  assert.strictEqual(appointmentsOverlap(t("11:00"), t("11:30"), t("10:00"), t("11:00")), false);
});
