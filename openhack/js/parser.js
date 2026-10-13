/*
 * parser.js - turns prescription text into draft medicine entries.
 *
 * Safety principle: this module only COPIES what the text says (name, dose, food instruction).
 * Dose text is never altered. When a frequency such as "twice daily" is found, suggested clock
 * times are marked `inferred: true` so the interface forces the user to confirm them.
 */
(function (root) {
  "use strict";

  var DOSE = /(\d+(?:[.,]\d+)?)\s?(mg|mcg|µg|g|ml|iu|units?)\b/i;
  var FORM = /^(?:tab(?:let)?s?|cap(?:sule)?s?|syp|syrup|inj(?:ection)?|drops?)\.?\s+/i;
  var LEAD = /^\s*(?:\d+\s*[.)]\s*)?/; // "1." or "2)"

  var SLOT = { m: "08:00", a: "14:00", n: "21:00" };

  /** Find a frequency in one line. Returns an array of "HH:MM" (suggested) or [] when none found. */
  function frequency(line) {
    var p = line.match(/\b([01])\s*[-+]\s*([01])\s*[-+]\s*([01])\b/);
    if (p) {
      var out = [];
      if (+p[1]) out.push(SLOT.m);
      if (+p[2]) out.push(SLOT.a);
      if (+p[3]) out.push(SLOT.n);
      return out;
    }
    if (/\b(qid|qds|four times|4 times)\b/i.test(line)) return ["08:00", "12:00", "16:00", "20:00"];
    if (/\b(tds|tid|thrice|three times|3 times)\b/i.test(line)) return ["08:00", "14:00", "20:00"];
    if (/\b(bd|bid|twice|two times|2 times)\b/i.test(line)) return ["08:00", "20:00"];
    if (/\b(hs|at night|bedtime)\b/i.test(line)) return [SLOT.n];
    if (/\b(od|once|daily|1 time|one time)\b/i.test(line)) return ["08:00"];
    return [];
  }

  /** Food instruction: before | after | with | any. */
  function instruction(line) {
    if (/before (food|meals?)|empty stomach/i.test(line)) return "before";
    if (/after (food|meals?)/i.test(line)) return "after";
    if (/with (food|meals?)/i.test(line)) return "with";
    return "any";
  }

  var WEEKLY = /\b(?:once\s+(?:a\s+)?week(?:ly)?|weekly|ow|(?:1|one)\s*(?:tab(?:let)?|cap(?:sule)?)?\s*(?:a|per|\/)\s*week|every\s+week)\b/i;
  var DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  /** "once weekly", "1 tab a week" -> true. */
  function weekly(line) { return WEEKLY.test(line) || /\bevery\s+(sun|mon|tue|wed|thu|fri|sat)/i.test(line); }

  /** "every Monday" / "on Fridays" -> 0..6, else null. */
  function weekday(line) {
    var m = line.match(/\b(?:every|on)\s+(sun|mon|tue|wed|thu|fri|sat)[a-z]*/i);
    return m ? DAYS.indexOf(m[1].toLowerCase()) : null;
  }

  /** "x 3 days", "for 1 week", "8 weeks" -> number of days. "every 3 days" is an interval, not a duration. */
  function duration(line) {
    var m = line.match(/(every\s+)?(\d+)\s*(days?|weeks?|wks?)\b/i);
    if (!m || m[1]) return null;
    var n = +m[2];
    return /^d/i.test(m[3]) ? n : n * 7;
  }

  /** Parse one line. Returns a draft or null if no medicine name and dose were found. */
  function parseLine(raw) {
    var line = raw.trim();
    var d = line.match(DOSE);
    if (!d) return null;
    var name = line.slice(0, d.index).replace(LEAD, "").replace(FORM, "").trim();
    if (!name) return null;
    var wk = weekly(line);
    var times = frequency(line);
    if (wk && !times.length) times = [SLOT.m];
    return {
      name: name,
      dose: d[0].replace(/\s+/, " ").trim(),
      times: times,
      instr: instruction(line),
      freq: wk ? "weekly" : "daily",
      weekday: wk ? weekday(line) : null,
      days: duration(line),
      inferred: times.length > 0
    };
  }

  /** Parse a whole prescription text. Lines without a name and dose are ignored. */
  function parseText(text) {
    return String(text || "").split(/\r?\n/).map(parseLine).filter(Boolean);
  }

  var SAMPLE = [
    "Rx",
    "1. Tab Metformin 500 mg twice daily after food",
    "2. Tab Amlodipine 5 mg once daily",
    "3. Tab Atorvastatin 10 mg 0-0-1 after food",
    "4. Cap Amoxicillin 500 mg thrice daily for 3 days after food",
    "5. Tab Alendronate 70 mg once weekly before food"
  ].join("\n");

  var api = { parseLine: parseLine, parseText: parseText, frequency: frequency, instruction: instruction, weekly: weekly, weekday: weekday, duration: duration, SAMPLE: SAMPLE };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Parser = api;
})(typeof window !== "undefined" ? window : globalThis);
