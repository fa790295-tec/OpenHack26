// Run with: node tests/core.test.js
const assert = require("assert");
const Core = require("../js/core.js");
const Parser = require("../js/parser.js");
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log("ok  " + name); };

test("parseTime accepts 12-hour and 24-hour input", () => {
  assert.strictEqual(Core.parseTime("8:30 PM"), "20:30");
  assert.strictEqual(Core.parseTime("8pm"), "20:00");
  assert.strictEqual(Core.parseTime("8:05 a.m."), "08:05");
  assert.strictEqual(Core.parseTime("20:30"), "20:30");
  assert.strictEqual(Core.parseTime("12:00 AM"), "00:00");
  assert.strictEqual(Core.parseTime("12:15 PM"), "12:15");
});
test("parseTime rejects invalid input", () => {
  ["25:00", "8", "13:00 PM", "0:30 AM", "8:75", "abc", ""].forEach(s => assert.strictEqual(Core.parseTime(s), null, s));
});
test("parseTimeList sorts, dedupes and reports invalid entries", () => {
  const r = Core.parseTimeList("8:00 PM, 8:00 AM; 20:00, nope");
  assert.deepStrictEqual(r.times, ["08:00", "20:00"]);
  assert.deepStrictEqual(r.invalid, ["nope"]);
});
test("fmt12 formats midnight and noon", () => {
  assert.strictEqual(Core.fmt12("00:05"), "12:05 AM");
  assert.strictEqual(Core.fmt12("12:00"), "12:00 PM");
  assert.strictEqual(Core.fmt12("20:30"), "8:30 PM");
});
test("status moves upcoming -> due -> missed, taken wins", () => {
  assert.strictEqual(Core.status(479, 480, 30, false), "up");
  assert.strictEqual(Core.status(480, 480, 30, false), "due");
  assert.strictEqual(Core.status(509, 480, 30, false), "due");
  assert.strictEqual(Core.status(510, 480, 30, false), "missed");
  assert.strictEqual(Core.status(900, 480, 30, true), "taken");
});
test("period groups by time of day", () => {
  assert.strictEqual(Core.period("08:00"), "morning");
  assert.strictEqual(Core.period("12:00"), "afternoon");
  assert.strictEqual(Core.period("17:00"), "night");
});
test("parser copies name and dose exactly", () => {
  const r = Parser.parseLine("1. Tab Metformin 500 mg twice daily after food");
  assert.strictEqual(r.name, "Metformin");
  assert.strictEqual(r.dose, "500 mg");
  assert.strictEqual(r.instr, "after");
  assert.deepStrictEqual(r.times, ["08:00", "20:00"]);
  assert.strictEqual(r.inferred, true);
});
test("parser reads 1-0-1 and 0-0-1 patterns", () => {
  assert.deepStrictEqual(Parser.parseLine("Atorvastatin 10mg 0-0-1").times, ["21:00"]);
  assert.deepStrictEqual(Parser.parseLine("Aspirin 75mg 1-0-1").times, ["08:00", "21:00"]);
});
test("parser leaves times empty when no frequency is written", () => {
  const r = Parser.parseLine("Paracetamol 500mg");
  assert.deepStrictEqual(r.times, []);
  assert.strictEqual(r.inferred, false);
});
test("parser ignores lines without a dose and handles the sample", () => {
  assert.strictEqual(Parser.parseLine("Rx"), null);
  assert.strictEqual(Parser.parseLine("Dr. Khan, Karachi"), null);
  assert.strictEqual(Parser.parseText(Parser.SAMPLE).length, 5);
});
test("parser reads before/with food and bedtime", () => {
  assert.strictEqual(Parser.instruction("take before food"), "before");
  assert.strictEqual(Parser.instruction("with meals"), "with");
  assert.deepStrictEqual(Parser.parseLine("Zolpidem 5 mg at bedtime").times, ["21:00"]);
});

// ---- weekly medicines and limited courses
const d = (y, m, day) => new Date(y, m - 1, day);
test("a 3-day course runs on day 1-3 and not after", () => {
  const m = { start: "2026-10-13", days: 3, freq: "daily" };
  assert.ok(Core.isScheduledOn(m, d(2026, 10, 13)));
  assert.ok(Core.isScheduledOn(m, d(2026, 10, 15)));
  assert.ok(!Core.isScheduledOn(m, d(2026, 10, 16)));
  assert.ok(!Core.isScheduledOn(m, d(2026, 10, 12)));
  assert.strictEqual(Core.lastDay(m), "2026-10-15");
  assert.deepStrictEqual(Core.courseDay(m, d(2026, 10, 14)), { n: 2, total: 3 });
  assert.ok(Core.courseEnded(m, d(2026, 10, 16)) && !Core.courseEnded(m, d(2026, 10, 15)));
});
test("a weekly medicine only appears on its weekday", () => {
  const m = { start: "2026-10-01", freq: "weekly", weekday: 1 }; // Monday
  assert.ok(Core.isScheduledOn(m, d(2026, 10, 12)));  // Monday
  assert.ok(!Core.isScheduledOn(m, d(2026, 10, 13))); // Tuesday
  assert.ok(Core.isScheduledOn(m, d(2026, 10, 19)));
});
test("medicines without course fields stay daily and endless", () => {
  const m = { id: "a", times: ["08:00"] };
  assert.ok(Core.isScheduledOn(m, d(2030, 1, 1)));
  assert.strictEqual(Core.courseDay(m, d(2030, 1, 1)), null);
});
test("a course crossing a month end is counted correctly", () => {
  const m = { start: "2026-10-30", days: 4 };
  assert.strictEqual(Core.lastDay(m), "2026-11-02");
});
test("parser reads weekly, weekday and duration", () => {
  let r = Parser.parseLine("Tab Alendronate 70 mg once weekly before food");
  assert.strictEqual(r.freq, "weekly"); assert.deepStrictEqual(r.times, ["08:00"]); assert.strictEqual(r.days, null);
  r = Parser.parseLine("Cap Amoxicillin 500 mg TDS x 3 days");
  assert.strictEqual(r.freq, "daily"); assert.strictEqual(r.days, 3);
  r = Parser.parseLine("Vitamin D 50000 IU 1 tab a week x 8 weeks");
  assert.strictEqual(r.freq, "weekly"); assert.strictEqual(r.days, 56);
  r = Parser.parseLine("Folic acid 5 mg every Monday");
  assert.strictEqual(r.freq, "weekly"); assert.strictEqual(r.weekday, 1);
  assert.strictEqual(Parser.parseLine("Drug X 10 mg every 3 days").days, null); // an interval, not a course length
});
console.log("\nall tests passed: " + passed);
