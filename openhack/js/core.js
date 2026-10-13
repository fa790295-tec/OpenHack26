/*
 * core.js - pure scheduling helpers (no DOM). Works in the browser and in Node for tests.
 * All times are stored as 24-hour "HH:MM" strings and displayed in 12-hour format.
 */
(function (root) {
  "use strict";

  var pad = function (n) { return String(n).padStart(2, "0"); };

  /** Parse "8:30 PM", "8pm", "8:30 p.m." or "20:30" into "HH:MM". Returns null if invalid. */
  function parseTime(input) {
    var m = String(input).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(a|p)?\.?(?:m\.?)?$/i);
    if (!m) return null;
    var h = +m[1];
    var min = m[2] === undefined ? 0 : +m[2];
    var ap = m[3] && m[3].toLowerCase();
    if (min > 59) return null;
    if (m[2] === undefined && !ap) return null; // "8" alone is ambiguous
    if (ap) {
      if (h < 1 || h > 12) return null;
      h = (h % 12) + (ap === "p" ? 12 : 0);
    } else if (h > 23) {
      return null;
    }
    return pad(h) + ":" + pad(min);
  }

  /** Parse a comma-separated list. Returns {times: sorted unique "HH:MM"[], invalid: string[]}. */
  function parseTimeList(text) {
    var times = [], invalid = [];
    String(text || "").split(/[,;]+/).forEach(function (part) {
      var p = part.trim();
      if (!p) return;
      var t = parseTime(p);
      if (t) { if (times.indexOf(t) < 0) times.push(t); } else invalid.push(p);
    });
    times.sort();
    return { times: times, invalid: invalid };
  }

  /** "20:30" -> "8:30 PM" */
  function fmt12(hhmm) {
    var p = hhmm.split(":").map(Number);
    return (p[0] % 12 || 12) + ":" + pad(p[1]) + " " + (p[0] < 12 ? "AM" : "PM");
  }

  function minutes(hhmm) {
    var p = hhmm.split(":").map(Number);
    return p[0] * 60 + p[1];
  }

  /** Status of one dose: taken | missed | due | up (upcoming). */
  function status(nowMin, doseMin, graceMin, taken) {
    if (taken) return "taken";
    if (nowMin >= doseMin + graceMin) return "missed";
    if (nowMin >= doseMin) return "due";
    return "up";
  }

  /** Day period for grouping: morning (before 12:00), afternoon (before 17:00), night. */
  function period(hhmm) {
    var m = minutes(hhmm);
    return m < 720 ? "morning" : m < 1020 ? "afternoon" : "night";
  }

  function dayKey(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function doseKey(medId, day, hhmm) { return medId + "|" + day + "|" + hhmm; }

  function parseDayKey(k) { var p = k.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function addDays(k, n) { var d = parseDayKey(k); d.setDate(d.getDate() + n); return dayKey(d); }
  /** Last day of a limited course (inclusive), or null when the medicine has no end date. */
  function lastDay(m) { return m.days && m.start ? addDays(m.start, +m.days - 1) : null; }
  /** Is this medicine scheduled on the given date? Honours start date, course length and weekly day. */
  function isScheduledOn(m, date) {
    var day = dayKey(date);
    if (m.start && day < m.start) return false;
    var end = lastDay(m);
    if (end && day > end) return false;
    if (m.freq === "weekly" && date.getDay() !== +m.weekday) return false;
    return true;
  }
  function courseEnded(m, date) { var end = lastDay(m); return !!end && dayKey(date) > end; }
  /** {n, total} for a limited course ("day 2 of 3"), else null. */
  function courseDay(m, date) {
    if (!m.days || !m.start) return null;
    return { n: Math.round((parseDayKey(dayKey(date)) - parseDayKey(m.start)) / 864e5) + 1, total: +m.days };
  }

  var api = { parseDayKey: parseDayKey, addDays: addDays, lastDay: lastDay, isScheduledOn: isScheduledOn,
              courseEnded: courseEnded, courseDay: courseDay, parseTime: parseTime, parseTimeList: parseTimeList, fmt12: fmt12, minutes: minutes,
              status: status, period: period, dayKey: dayKey, doseKey: doseKey };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Core = api;
})(typeof window !== "undefined" ? window : globalThis);
