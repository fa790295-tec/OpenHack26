/* app.js - MedAssist interface. State, views, event handling, reminders. */
(function () {
  "use strict";

  var Core = window.Core, Parser = window.Parser, Speech = window.Speech;
  var KEY = "medassist.v2";

  /* ---------- State ---------- */
  function defaults() {
    return { lang: "en", meds: [], log: {}, cg: { name: "", phone: "" }, grace: 30, size: 1,
             voice: true, sos: "", theme: null, seenGuide: false, discMin: false };
  }
  function load() {
    try { return Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || "{}")); }
    catch (e) { return defaults(); }
  }
  var S = load();
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  var ui = { tab: "today", editing: null, draft: [], ocrText: "", imgURL: "", scanMsg: "", scanMsgKind: "",
             collapsed: {}, modal: false, lastFocus: null };
  var file = null, alerts = {}, lastSig = "", yesFn = null;

  /* ---------- Helpers ---------- */
  function t(k) { return I18N.t(S.lang, k); }
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function icon(n, cls) { return '<svg class="i ' + (cls || "") + '" aria-hidden="true" focusable="false"><use href="#i-' + n + '"/></svg>'; }
  function fill(str, map) { return str.replace(/\{(\w+)\}/g, function (_, k) { return map[k] != null ? map[k] : ""; }); }
  function medById(id) { return S.meds.filter(function (m) { return m.id === id; })[0]; }
  function hue(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
  function capsule(name) { return '<svg class="i capsule" style="color:hsl(' + hue(name) + ' 62% 42%)" aria-hidden="true"><use href="#i-pill"/></svg>'; }
  var FOOD_ICON = { before: "utensils", after: "utensils", with: "utensils", any: "clock" };
  function instrChip(k) { var key = k || "any"; return '<span class="chip">' + icon(FOOD_ICON[key]) + esc(t(key)) + "</span>"; }
  function weekdayName(i) { return I18N.weekday(S.lang, +i); }
  /** Keep a dose such as "500 mg" in reading order inside right-to-left text. */
  function ds(d) { return "\u2066" + d + "\u2069"; }
  /** Display a 12-hour time inside right-to-left text without the AM/PM jumping to the front. */
  function tm(h) { return "\u2066" + Core.fmt12(h) + "\u2069"; }
  function courseChips(m) {
    var h = "", now = new Date();
    if (m.freq === "weekly") h += '<span class="chip">' + icon("calendar") + esc(fill(t("everyWeek"), { d: weekdayName(m.weekday) })) + "</span>";
    if (Core.courseEnded(m, now)) return h + '<span class="chip">' + icon("check") + esc(t("finished")) + "</span>";
    var c = Core.courseDay(m, now);
    if (c) {
      h += '<span class="chip">' + icon("calendar") + esc(fill(t("courseDay"), { a: c.n, b: c.total })) + "</span>";
      if (c.n === c.total) h += '<span class="chip" style="color:var(--due);border-color:var(--due)">' + esc(t("lastDay")) + "</span>";
    }
    return h;
  }
  function freqSelect(id, val, extra) {
    return '<select class="sel" id="' + id + '" ' + (extra || "") + ">" + ["daily", "weekly"].map(function (o) {
      return '<option value="' + o + '"' + ((val || "daily") === o ? " selected" : "") + ">" + esc(t(o)) + "</option>"; }).join("") + "</select>";
  }
  function weekdaySelect(id, val, extra) {
    var v = val == null || val === "" ? new Date().getDay() : +val, o = "";
    for (var i = 0; i < 7; i++) o += '<option value="' + i + '"' + (v === i ? " selected" : "") + ">" + esc(weekdayName(i)) + "</option>";
    return '<select class="sel" id="' + id + '" ' + (extra || "") + ">" + o + "</select>";
  }
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function toast(msg) {
    var e = $("#toast"); e.textContent = msg; e.style.display = "block";
    clearTimeout(toast._t); toast._t = setTimeout(function () { e.style.display = "none"; }, 5000);
  }
  function speak(text) {
    var r = Speech.speak(text, S.lang);
    if (r !== "ok") toast(t("novoice"));
  }

  /* ---------- Doses ---------- */
  function doses() {
    var now = new Date(), day = Core.dayKey(now), nm = now.getHours() * 60 + now.getMinutes(), out = [];
    S.meds.forEach(function (m) {
      if (!Core.isScheduledOn(m, now)) return;
      m.times.forEach(function (h) {
        var k = Core.doseKey(m.id, day, h);
        out.push({ m: m, h: h, k: k, st: Core.status(nm, Core.minutes(h), S.grace, S.log[k] === "taken") });
      });
    });
    return out.sort(function (a, b) { return Core.minutes(a.h) - Core.minutes(b.h); });
  }
  function caregiverLink(x) {
    var text = fill(t("msg"), { n: x.m.name, d: x.m.dose, t: Core.fmt12(x.h) });
    return "https://wa.me/" + S.cg.phone.replace(/\D/g, "") + "?text=" + encodeURIComponent(text);
  }
  function mark(k, taken) {
    var m = medById(k.split("|")[0]), tracked = m && m.left !== "" && m.left != null;
    if (taken) { if (S.log[k] !== "taken" && tracked) m.left = Math.max(0, m.left - 1); S.log[k] = "taken"; }
    else { if (S.log[k] === "taken" && tracked) m.left++; delete S.log[k]; }
    persist(); render();
  }

  /* ---------- Views: Today ---------- */
  var STATUS_ICON = { taken: "check", missed: "x", due: "bell", up: "clock" };

  function doseCard(x, hero) {
    var done = x.st === "taken";
    var primary = done
      ? '<button class="btn ghost" data-act="mark" data-k="' + esc(x.k) + '" data-v="0">' + icon("undo") + esc(t("undo")) + "</button>"
      : '<button class="btn" data-act="mark" data-k="' + esc(x.k) + '" data-v="1">' + icon("check") + esc(t("markTaken")) + "</button>";
    var care = x.st === "missed" && S.cg.phone
      ? '<a class="btn danger" target="_blank" rel="noopener" href="' + caregiverLink(x) + '">' + icon("message") + esc(t("notify")) + "</a>" : "";
    return '<article class="dose s-' + x.st + (hero ? " hero" : "") + '">' +
      '<div class="dose-top"><span class="dose-time">' + esc(tm(x.h)) + "</span>" +
      '<span class="badge b-' + x.st + '">' + icon(STATUS_ICON[x.st]) + esc(t(x.st)) + "</span></div>" +
      '<div style="grid-column:1/-1"><h3 class="dose-name">' + capsule(x.m.name) + esc(x.m.name) + '</h3><p class="dose-dose">' + esc(ds(x.m.dose)) + "</p>" + instrChip(x.m.instr) + courseChips(x.m) + "</div>" +
      '<div class="dose-actions">' + primary + care +
      '<button class="btn-icon" data-act="say" data-id="' + x.m.id + '" data-h="' + x.h + '" aria-label="' + esc(t("listen")) + '" title="' + esc(t("listen")) + '">' + icon("volume") + "</button>" +
      '<button class="btn-icon" data-act="zoom" data-id="' + x.m.id + '" aria-label="' + esc(t("magnify")) + '" title="' + esc(t("magnify")) + '">' + icon("zoom") + "</button></div></article>";
  }

  function viewToday() {
    var d = doses();
    var dateStr = I18N.longDate(S.lang, new Date());
    var h = '<h1 class="view-h">' + esc(t("today")) + '</h1><p class="sub">' + esc(dateStr) + "</p>";
    if (!d.length && S.meds.length) {
      return h + '<section class="empty">' + icon("check") + "<h2>" + esc(t("emptyToday")) + '</h2><p class="mu">' + esc(t("emptyTodayBody")) + "</p></section>";
    }
    if (!d.length) {
      return h + '<section class="empty">' + icon("pill") + "<h2>" + esc(t("emptyTitle")) + '</h2><p class="mu">' + esc(t("emptyBody")) + "</p>" +
        '<div class="row"><button class="btn" data-act="go" data-tab="scan">' + icon("camera") + esc(t("scan")) + '</button><button class="btn secondary" data-act="newMed">' + icon("plus") + esc(t("add")) + "</button></div></section>";
    }
    var taken = d.filter(function (x) { return x.st === "taken"; }).length;
    h += '<div class="meter" role="img" aria-label="' + esc(fill(t("prog"), { a: taken, b: d.length })) + '"><i style="width:' + (taken / d.length * 100) + '%"></i></div>';
    h += '<p class="small mu" style="margin:-6px 0 12px">' + esc(fill(t("prog"), { a: taken, b: d.length })) + "</p>";

    var periods = [["morning", "sunrise"], ["afternoon", "sun"], ["night", "moon"]];
    h += '<div class="tray" role="group" aria-label="' + esc(t("today")) + '">';
    periods.forEach(function (p) {
      var g = d.filter(function (x) { return Core.period(x.h) === p[0]; });
      var tk = g.filter(function (x) { return x.st === "taken"; }).length;
      var ms = g.some(function (x) { return x.st === "missed"; });
      var cls = !g.length ? "none" : tk === g.length ? "full" : ms ? "miss" : "part";
      h += '<button class="cell ' + cls + '" data-act="jump" data-g="' + p[0] + '"' + (g.length ? "" : " disabled") + '><span class="well">' + icon(tk === g.length && g.length ? "check" : p[1]) +
        '</span><span class="n">' + (g.length ? tk + "/" + g.length : "-") + '</span><span class="l">' + esc(t(p[0])) + "</span></button>";
    });
    h += "</div>";

    S.meds.forEach(function (m) {
      if (m.left === "" || m.left == null || Core.courseEnded(m, new Date())) return;
      var days = Math.floor(m.left / ((m.times.length || 1) / (m.freq === "weekly" ? 7 : 1)));
      if (days <= 3) h += '<div class="notice" style="margin-top:12px">' + icon("alert") + "<span>" + esc(fill(t("low"), { n: m.name, p: m.left, d: days })) + "</span></div>";
    });

    var nxt = d.filter(function (x) { return x.st === "due"; })[0] || d.filter(function (x) { return x.st === "up"; })[0];
    if (nxt) h += '<h2 class="section-h">' + esc(t("next")) + "</h2>" + doseCard(nxt, true);

    periods.forEach(function (p) {
      var g = d.filter(function (x) { return Core.period(x.h) === p[0]; });
      if (!g.length) return;
      var open = !ui.collapsed[p[0]];
      h += '<button class="group-h" id="g-' + p[0] + '" data-act="toggle" data-g="' + p[0] + '" aria-expanded="' + open + '">' + icon(p[1]) + "<span>" + esc(t(p[0])) +
        ' <span class="count">(' + g.length + ")</span></span>" + icon("chevron") + "</button>";
      if (open) h += '<div class="grid">' + g.map(function (x) { return doseCard(x); }).join("") + "</div>";
    });
    return h;
  }

  /* ---------- Views: Medicines ---------- */
  function micBtn(target) {
    return '<button class="btn-icon" type="button" data-act="mic" data-target="' + target + '" aria-label="' + esc(t("speak")) + '" title="' + esc(t("speak")) + '">' + icon("mic") + "</button>";
  }
  function instrSelect(id, val, extra) {
    return '<select class="sel" id="' + id + '" ' + (extra || "") + ">" + ["any", "before", "after", "with"].map(function (o) {
      return '<option value="' + o + '"' + (val === o ? " selected" : "") + ">" + esc(t(o)) + "</option>"; }).join("") + "</select>";
  }
  function medForm(m, idx) {
    return '<section class="card" aria-label="' + esc(idx >= 0 ? t("edit") : t("add")) + '"><h2>' + esc(idx >= 0 ? t("edit") : t("add")) + "</h2>" +
      '<label class="f" for="f_n">' + esc(t("name")) + '</label><div class="field"><input type="text" id="f_n" value="' + esc(m.name) + '" autocomplete="off">' + micBtn("f_n") + "</div>" +
      '<label class="f" for="f_d">' + esc(t("dose")) + '</label><div class="field"><input type="text" id="f_d" value="' + esc(m.dose) + '" autocomplete="off">' + micBtn("f_d") + "</div>" +
      '<label class="f" for="f_t">' + esc(t("times")) + '</label><input type="text" dir="ltr" id="f_t" data-hint="f_th" value="' + esc(m.times.map(Core.fmt12).join(", ")) + '" autocomplete="off"><p class="hint" id="f_th" aria-live="polite"></p>' +
      '<label class="f" for="f_f">' + esc(t("freq")) + "</label>" + freqSelect("f_f", m.freq) +
      '<div id="f_wk"' + (m.freq === "weekly" ? "" : " hidden") + '><label class="f" for="f_w">' + esc(t("weekday")) + "</label>" + weekdaySelect("f_w", m.weekday) + "</div>" +
      '<label class="f" for="f_dy">' + esc(t("days")) + '</label><input type="number" inputmode="numeric" min="1" id="f_dy" value="' + esc(m.days || "") + '"><p class="hint">' + esc(t("daysHint")) + "</p>" +
      '<label class="f" for="f_i">' + esc(t("instr")) + "</label>" + instrSelect("f_i", m.instr) +
      '<label class="f" for="f_l">' + esc(t("left")) + '</label><input type="number" inputmode="numeric" min="0" id="f_l" value="' + esc(m.left == null ? "" : m.left) + '">' +
      '<p class="err" id="f_err" role="alert"></p>' +
      '<div class="row" style="margin-top:16px"><button class="btn" data-act="saveMed" data-i="' + idx + '">' + icon("check") + esc(t("save")) + '</button><button class="btn ghost" data-act="cancelEdit">' + esc(t("cancel")) + "</button>" +
      (idx >= 0 ? '<button class="btn danger" data-act="askDel" data-i="' + idx + '" style="margin-inline-start:auto">' + icon("trash") + esc(t("del")) + "</button>" : "") + "</div></section>";
  }
  function viewMeds() {
    var h = '<div class="row between"><h1 class="view-h">' + esc(t("meds")) + "</h1>" +
      (ui.editing === null ? '<button class="btn" data-act="newMed">' + icon("plus") + esc(t("add")) + "</button>" : "") + "</div>";
    if (ui.editing === -1) h += medForm({ name: "", dose: "", times: [], instr: "any" }, -1);
    if (!S.meds.length && ui.editing === null) {
      return h + '<section class="empty">' + icon("pill") + "<h2>" + esc(t("emptyTitle")) + '</h2><p class="mu">' + esc(t("emptyBody")) + "</p></section>";
    }
    h += '<div class="grid" style="margin-top:12px">';
    S.meds.forEach(function (m, i) {
      if (ui.editing === i) { h += '<div style="grid-column:1/-1">' + medForm(m, i) + "</div>"; return; }
      h += '<article class="card" style="margin:0"><div class="row between"><div><h3 class="dose-name">' + capsule(m.name) + esc(m.name) + '</h3><p class="dose-dose">' + esc(ds(m.dose)) + "</p></div>" +
        '<button class="btn-icon" data-act="editMed" data-i="' + i + '" aria-label="' + esc(t("edit")) + '" title="' + esc(t("edit")) + '">' + icon("pencil") + "</button></div>" +
        '<p style="margin-top:8px"><b>' + esc(m.times.map(tm).join(", ")) + "</b></p>" + instrChip(m.instr) + courseChips(m) +
        (m.left !== "" && m.left != null ? '<p class="small mu" style="margin-top:6px">' + esc(t("left").replace(/ \(.*\)/, "")) + ": " + esc(m.left) + "</p>" : "") + "</article>";
    });
    return h + "</div>";
  }
  function saveMed(i) {
    var name = $("#f_n").value.trim(), times = Core.parseTimeList($("#f_t").value), err = $("#f_err");
    if (!name) { err.textContent = t("errName"); $("#f_n").focus(); return; }
    if (!times.times.length || times.invalid.length) { err.textContent = t("errTimes"); $("#f_t").focus(); return; }
    var dy = $("#f_dy").value.trim();
    if (dy !== "" && (!/^\d+$/.test(dy) || +dy < 1)) { err.textContent = t("errDays"); $("#f_dy").focus(); return; }
    var l = $("#f_l").value, old = i >= 0 ? S.meds[i] : null;
    var m = { id: old ? old.id : newId(), name: name, dose: $("#f_d").value.trim(), times: times.times, instr: $("#f_i").value, left: l === "" ? "" : +l,
              freq: $("#f_f").value, weekday: +$("#f_w").value, days: dy === "" ? "" : +dy, start: old && old.start ? old.start : Core.dayKey(new Date()) };
    if (i >= 0) S.meds[i] = m; else S.meds.push(m);
    ui.editing = null; persist(); render();
  }

  /* ---------- Views: Scan ---------- */
  function viewScan() {
    var h = '<h1 class="view-h">' + esc(t("scan")) + "</h1>" +
      '<div class="steps"><span><b>1</b>' + esc(t("step1")) + "</span><span><b>2</b>" + esc(t("step2")) + "</span><span><b>3</b>" + esc(t("step3")) + "</span></div>";
    h += '<section class="card"><label class="f" for="photo" style="margin-top:0">' + esc(t("pick")) + '</label><input type="file" id="photo" accept="image/*">' +
      (ui.imgURL ? '<p class="small mu" style="margin-top:8px">' + esc(t("tapzoom")) + '</p><div class="preview" data-act="zoomImg"><img src="' + ui.imgURL + '" alt=""></div>' : "") +
      '<div class="row" style="margin-top:12px"><button class="btn secondary" data-act="ocr">' + icon("image") + esc(t("ocr")) + '</button><button class="btn ghost" data-act="sample">' + esc(t("sample")) + "</button></div></section>";
    h += '<section class="card"><label class="f" for="ptxt" style="margin-top:0">' + esc(t("paste")) + '</label><div class="field"><textarea id="ptxt" rows="6" dir="ltr">' + esc(ui.ocrText) + "</textarea>" + micBtn("ptxt") + "</div>" +
      '<div class="row" style="margin-top:12px"><button class="btn" data-act="extract">' + esc(t("parse")) + "</button></div>" +
      '<p class="hint ' + (ui.scanMsgKind || "") + '" id="scanMsg" role="status" aria-live="polite">' + esc(ui.scanMsg) + "</p></section>";
    if (ui.draft.length) {
      h += '<h2 class="section-h">' + esc(t("step3")) + "</h2>";
      h += '<div class="grid">' + ui.draft.map(function (m, i) {
        return '<article class="card" style="margin:0"><label class="f" style="margin-top:0" for="d_n' + i + '">' + esc(t("name")) + '</label><input type="text" id="d_n' + i + '" data-draft="name" data-i="' + i + '" value="' + esc(m.name) + '">' +
          '<label class="f" for="d_d' + i + '">' + esc(t("dose")) + '</label><input type="text" id="d_d' + i + '" data-draft="dose" data-i="' + i + '" value="' + esc(m.dose) + '">' +
          '<label class="f" for="d_t' + i + '">' + esc(t("times")) + '</label><input type="text" dir="ltr" id="d_t' + i + '" data-draft="timesText" data-hint="d_h' + i + '" data-i="' + i + '" value="' + esc(m.timesText) + '">' +
          (m.inferred ? '<p class="notice" id="d_c' + i + '" style="margin:8px 0 0">' + icon("alert") + "<span>" + esc(t("check")) + "</span></p>" : "") +
          '<p class="hint" id="d_h' + i + '" aria-live="polite"></p>' +
          '<label class="f" for="d_f' + i + '">' + esc(t("freq")) + "</label>" + freqSelect("d_f" + i, m.freq, 'data-draft="freq" data-i="' + i + '"') +
          '<div id="d_wk' + i + '"' + (m.freq === "weekly" ? "" : " hidden") + '><label class="f" for="d_w' + i + '">' + esc(t("weekday")) + "</label>" + weekdaySelect("d_w" + i, m.weekday, 'data-draft="weekday" data-i="' + i + '"') + "</div>" +
          '<label class="f" for="d_y' + i + '">' + esc(t("days")) + '</label><input type="number" inputmode="numeric" min="1" id="d_y' + i + '" data-draft="days" data-i="' + i + '" value="' + esc(m.days || "") + '">' +
          '<label class="f" for="d_i' + i + '">' + esc(t("instr")) + "</label>" + instrSelect("d_i" + i, m.instr, 'data-draft="instr" data-i="' + i + '"') + "</article>";
      }).join("") + "</div>";
      h += '<div class="row" style="margin-top:14px"><button class="btn" data-act="addDraft">' + icon("check") + esc(t("addall")) + "</button></div>";
    }
    return h;
  }
  function setScanMsg(msg, kind) { ui.scanMsg = msg; ui.scanMsgKind = kind || ""; var e = $("#scanMsg"); if (e) { e.textContent = msg; e.className = "hint " + (kind || ""); } }
  function ocr() {
    var ta = $("#ptxt"); if (ta) ui.ocrText = ta.value;
    if (!file) { setScanMsg(t("nophoto"), "bad"); return; }
    setScanMsg(t("ocrRun"));
    var load = window.Tesseract ? Promise.resolve() : new Promise(function (ok, no) {
      var s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js"; s.onload = ok; s.onerror = no; document.head.appendChild(s);
    });
    load.then(function () {
      return Promise.race([window.Tesseract.recognize(file, "eng"), new Promise(function (_, no) { setTimeout(no, 60000); })]);
    }).then(function (r) { ui.ocrText = r.data.text; ui.scanMsg = ""; render(); })
      .catch(function () { setScanMsg(t("ocrfail"), "bad"); });
  }
  function extract() {
    ui.ocrText = $("#ptxt").value;
    ui.draft = Parser.parseText(ui.ocrText).map(function (m) {
      return { name: m.name, dose: m.dose, timesText: m.times.map(Core.fmt12).join(", "), instr: m.instr, inferred: m.inferred,
               freq: m.freq, weekday: m.weekday != null ? m.weekday : new Date().getDay(), days: m.days || "" };
    });
    ui.scanMsg = ui.draft.length ? fill(t("found"), { n: ui.draft.length }) : t("nothing");
    ui.scanMsgKind = ui.draft.length ? "ok" : "bad";
    render();
  }
  function addDraft() {
    var ok = ui.draft.every(function (m) { var p = Core.parseTimeList(m.timesText); return m.name.trim() && p.times.length && !p.invalid.length; });
    if (!ok) { setScanMsg(t("errTimes"), "bad"); return; }
    var daysOk = ui.draft.every(function (m) { var s = String(m.days).trim(); return s === "" || (/^\d+$/.test(s) && +s >= 1); });
    if (!daysOk) { setScanMsg(t("errDays"), "bad"); return; }
    ui.draft.forEach(function (m) {
      S.meds.push({ id: newId(), name: m.name.trim(), dose: m.dose.trim(), times: Core.parseTimeList(m.timesText).times, instr: m.instr, left: "",
        freq: m.freq, weekday: +m.weekday, days: String(m.days).trim() === "" ? "" : +m.days, start: Core.dayKey(new Date()) });
    });
    ui.draft = []; ui.scanMsg = ""; persist(); ui.tab = "today"; render();
  }

  /* ---------- Views: Settings ---------- */
  function week() {
    var out = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(); d.setDate(d.getDate() - i);
      var ds = Core.dayKey(d), n = 0;
      var tot = S.meds.reduce(function (a, m) { return a + (Core.isScheduledOn(m, d) ? m.times.length : 0); }, 0);
      for (var k in S.log) if (S.log[k] === "taken" && k.split("|")[1] === ds) n++;
      var label = S.lang === "en" ? d.toLocaleDateString("en-GB", { weekday: "short" }) : I18N.weekday(S.lang, d.getDay());
      out.push({ label: label, n: n, tot: tot });
    }
    return out;
  }
  function seg(name, opts, val) {
    return '<div class="seg" role="group">' + opts.map(function (o) {
      return '<button type="button" data-act="' + name + '" data-v="' + o[0] + '" aria-pressed="' + (String(val) === String(o[0])) + '">' + esc(o[1]) + "</button>"; }).join("") + "</div>";
  }
  function viewSettings() {
    var w = week();
    return '<h1 class="view-h">' + esc(t("more")) + "</h1>" +
      '<section class="card"><h2>' + esc(t("textSize")) + "</h2>" + seg("size", [[0, t("sizeS")], [1, t("sizeL")], [2, t("sizeXL")]], S.size) +
      '<h2 style="margin-top:18px">' + esc(t("theme")) + "</h2>" + seg("themeSet", [["auto", t("auto")], ["light", t("light")], ["dark", t("dark")]], S.theme || "auto") + "</section>" +
      '<section class="card"><h2>' + esc(t("alerts")) + '</h2><button class="switch" role="switch" aria-checked="' + !!S.voice + '" data-act="voice"><span>' + esc(t("voice")) + '</span><span class="track"></span></button>' +
      '<button class="btn secondary" data-act="notifPerm" style="margin-top:8px">' + icon("bell") + esc(t("notif")) + "</button>" +
      '<label class="f" for="s_g">' + esc(t("grace")) + '</label><input type="number" inputmode="numeric" min="5" max="240" id="s_g" data-set="grace" value="' + S.grace + '"></section>' +
      '<section class="card"><h2>' + esc(t("cg")) + '</h2><label class="f" for="s_cn" style="margin-top:0">' + esc(t("cgn")) + '</label><input type="text" id="s_cn" data-set="cg.name" value="' + esc(S.cg.name) + '">' +
      '<label class="f" for="s_cp">' + esc(t("cgp")) + '</label><input type="tel" dir="ltr" id="s_cp" data-set="cg.phone" placeholder="923001234567" value="' + esc(S.cg.phone) + '">' +
      '<label class="f" for="s_sos">' + esc(t("sosn")) + '</label><input type="tel" dir="ltr" id="s_sos" data-set="sos" value="' + esc(S.sos) + '"></section>' +
      '<section class="card"><h2>' + esc(t("report")) + '</h2><div class="bars">' + w.map(function (r) {
        return '<div class="bar"><span>' + esc(r.label) + '</span><span class="track"><i style="width:' + (r.tot ? Math.min(100, r.n / r.tot * 100) : 0) + '%"></i></span><span>' + r.n + "/" + r.tot + "</span></div>"; }).join("") +
      '</div><button class="btn ghost" data-act="share" style="margin-top:14px">' + icon("share") + esc(t("share")) + "</button></section>";
  }

  /* ---------- Modals ---------- */
  function openModal(html, bad) {
    ui.lastFocus = document.activeElement; ui.modal = true;
    var o = $("#overlay"); o.innerHTML = '<div class="sheet' + (bad ? " bad" : "") + '" role="alertdialog" aria-modal="true" aria-labelledby="mTitle">' + html + "</div>"; o.hidden = false;
    var f = o.querySelector("button, a"); if (f) f.focus();
  }
  function closeModal() {
    ui.modal = false; $("#overlay").hidden = true; $("#overlay").innerHTML = ""; Speech.stop();
    if (ui.lastFocus && document.body.contains(ui.lastFocus)) ui.lastFocus.focus();
    render();
  }
  function askDelete(i) {
    yesFn = function () { S.meds.splice(i, 1); ui.editing = null; persist(); };
    openModal('<h2 id="mTitle">' + esc(t("sure")) + '</h2><p class="mu" style="margin-top:6px">' + esc(S.meds[i].name) + " " + esc(S.meds[i].dose) + "</p>" +
      '<div class="stack"><button class="btn danger" data-act="yes">' + icon("trash") + esc(t("yes")) + '</button><button class="btn ghost" data-act="closeModal">' + esc(t("no")) + "</button></div>", true);
  }
  function showHelp() {
    var steps = [t("h1"), t("h2"), t("h3")];
    window._helpText = steps.join(" ");
    openModal('<h2 id="mTitle">' + esc(t("helpTitle")) + '</h2><ol class="help-list">' + steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>" +
      '<div class="stack"><button class="btn secondary" data-act="readHelp">' + icon("volume") + esc(t("listen")) + '</button><button class="btn" data-act="closeModal">' + esc(t("ok")) + "</button></div>");
    S.seenGuide = true; persist();
  }
  function showMagnifier(m) {
    openModal('<div class="mag"><div class="m-name" id="mTitle">' + esc(m.name) + '</div><div class="m-dose">' + esc(ds(m.dose)) + '</div><div class="m-time">' + esc(m.times.map(tm).join("   ")) + '</div><div class="m-instr">' + esc(t(m.instr || "any")) + "</div></div>" +
      '<div class="stack"><button class="btn" data-act="closeModal">' + esc(t("close")) + "</button></div>");
  }
  function showAlert(x, mode) {
    var miss = mode === "missed", bad = miss || mode === "again";
    var title = miss ? fill(t("missTitle"), { t: tm(x.h), n: x.m.name }) : t(mode === "again" ? "againTitle" : "dueTitle");
    var spoken = miss ? fill(t("missTitle"), { t: Core.fmt12(x.h), n: x.m.name }) : x.m.name + ". " + x.m.dose + ". " + Core.fmt12(x.h) + ". " + t(x.m.instr || "any");
    window._alertText = spoken;
    openModal('<div class="mag">' + icon(miss ? "x" : "bell", "big-i") + '<h2 id="mTitle" style="margin-top:8px">' + esc(title) + "</h2>" +
      '<p style="font-size:1.4rem;margin-top:10px"><b>' + esc(x.m.name) + "</b> " + esc(ds(x.m.dose)) + '</p><p class="mu">' + esc(tm(x.h)) + " &middot; " + esc(t(x.m.instr || "any")) + "</p></div>" +
      '<div class="stack"><button class="btn" data-act="alertTaken" data-k="' + esc(x.k) + '">' + icon("check") + esc(t("markTaken")) + "</button>" +
      (miss ? (S.cg.phone ? '<a class="btn danger" target="_blank" rel="noopener" href="' + caregiverLink(x) + '">' + icon("message") + esc(t("notify")) + "</a>" : "") : '<button class="btn ghost" data-act="closeModal">' + icon("clock") + esc(t("snooze")) + "</button>") +
      '<button class="btn secondary" data-act="readAlert">' + icon("volume") + esc(t("listen")) + "</button>" +
      (miss ? '<button class="btn ghost" data-act="closeModal">' + esc(t("close")) + "</button>" : "") + "</div>", bad);
    try { if (navigator.vibrate) navigator.vibrate(bad ? [600, 200, 600, 200, 600] : [300, 150, 300]); } catch (e) {}
    if (S.voice) speak(spoken);
    try { if (window.Notification && Notification.permission === "granted") new Notification("MedAssist", { body: title + " - " + x.m.name + " " + x.m.dose }); } catch (e) {}
  }

  /* ---------- Reminder loop ---------- */
  function tick() {
    if (ui.modal) return;
    var now = Date.now(), d = new Date(), nm = d.getHours() * 60 + d.getMinutes(), list = doses();
    for (var i = 0; i < list.length; i++) {
      var x = list[i]; if (x.st === "taken") continue;
      var el = nm - Core.minutes(x.h); if (el < 0 || el > S.grace + 15) continue;
      var a = alerts[x.k];
      if (x.st === "missed") { if (!a || !a.missed) { alerts[x.k] = Object.assign({}, a, { missed: true }); showAlert(x, "missed"); return; } continue; }
      if (!a || now >= a.next) { var lvl = a ? a.lvl + 1 : 1; alerts[x.k] = { lvl: lvl, next: now + 600000 }; showAlert(x, lvl > 1 ? "again" : "due"); return; }
    }
    if (ui.tab === "today") { var sig = list.map(function (x) { return x.k + x.st; }).join(); if (sig !== lastSig) render(); }
  }

  /* ---------- Chrome: nav, header, theme ---------- */
  function effectiveDark() { return S.theme ? S.theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches; }
  function renderChrome() {
    var r = document.documentElement;
    r.dir = S.lang === "en" ? "ltr" : "rtl"; r.lang = S.lang;
    r.style.setProperty("--k", [1, 1.18, 1.4][S.size]);
    if (S.theme) r.dataset.theme = S.theme; else delete r.dataset.theme;
    $("#lang").value = S.lang; $("#langLabel").textContent = t("language");
    var set = function (id, key) { var b = $(id); b.setAttribute("aria-label", t(key)); b.title = t(key); b.querySelector(".sr").textContent = t(key); };
    set("#btnSize", "textSize"); set("#btnTheme", "toggleTheme"); set("#btnHelp", "help");
    $("#btnTheme use").setAttribute("href", effectiveDark() ? "#i-sun" : "#i-moon");
    $("#sosText").textContent = t("sos"); $("#btnSos").setAttribute("aria-label", t("sos"));
    var tabs = [["today", "home"], ["meds", "pill"], ["scan", "camera"], ["more", "sliders"]];
    $("#nav").innerHTML = tabs.map(function (x) {
      return '<button type="button" data-act="go" data-tab="' + x[0] + '"' + (ui.tab === x[0] ? ' aria-current="page"' : "") + ">" + icon(x[1]) + "<span>" + esc(t(x[0])) + "</span></button>"; }).join("");
    $("#disc").innerHTML = '<button type="button" data-act="disc" aria-expanded="' + !S.discMin + '">' + icon("alert") + "<span>" + esc(t("safety")) + "</span>" + icon("chevron") + "</button>" + (S.discMin ? "" : "<p>" + esc(t("disc")) + "</p>");
  }
  function render() {
    renderChrome();
    if (ui.modal) return;
    lastSig = doses().map(function (x) { return x.k + x.st; }).join();
    $("#app").innerHTML = ({ today: viewToday, meds: viewMeds, scan: viewScan, more: viewSettings })[ui.tab]();
    document.querySelectorAll("[data-hint]").forEach(updateHint);
  }
  function updateHint(el) {
    var h = document.getElementById(el.dataset.hint); if (!h || !el.value.trim()) { if (h && !h.dataset.keep && !el.value.trim()) h.textContent = ""; return; }
    var p = Core.parseTimeList(el.value);
    if (p.invalid.length) { h.className = "hint bad"; h.textContent = fill(t("timesBad"), { t: p.invalid.join(", ") }); }
    else { h.className = "hint ok"; h.textContent = fill(t("timesOk"), { t: p.times.map(tm).join(", ") }); }
  }

  /* ---------- Events ---------- */
  var actions = {
    go: function (d) { ui.tab = d.tab; ui.editing = null; render(); window.scrollTo(0, 0); },
    toggle: function (d) { ui.collapsed[d.g] = !ui.collapsed[d.g]; render(); var b = document.getElementById("g-" + d.g); if (b) b.focus(); },
    jump: function (d) { ui.collapsed[d.g] = false; render(); var b = document.getElementById("g-" + d.g); if (b) { b.scrollIntoView({ block: "start" }); b.focus(); } },
    mark: function (d) { mark(d.k, d.v === "1"); },
    say: function (d) { var m = medById(d.id); if (m) speak(m.name + ". " + m.dose + ". " + Core.fmt12(d.h) + ". " + t(m.instr || "any")); },
    zoom: function (d) { var m = medById(d.id); if (m) showMagnifier(m); },
    newMed: function () { ui.tab = "meds"; ui.editing = -1; render(); var f = $("#f_n"); if (f) f.focus(); },
    editMed: function (d) { ui.editing = +d.i; render(); var f = $("#f_n"); if (f) f.focus(); },
    cancelEdit: function () { ui.editing = null; render(); },
    saveMed: function (d) { saveMed(+d.i); },
    askDel: function (d) { askDelete(+d.i); },
    yes: function () { if (yesFn) yesFn(); yesFn = null; closeModal(); },
    closeModal: closeModal,
    mic: function (d) {
      var ok = Speech.listen(S.lang, function (txt) { var el = document.getElementById(d.target); el.value = el.value ? el.value + " " + txt : txt; el.dispatchEvent(new Event("input", { bubbles: true })); }, function () { toast(t("nomic")); });
      if (!ok) toast(t("nomic"));
    },
    zoomImg: function (d, el) { el.classList.toggle("z"); },
    ocr: ocr, extract: extract, addDraft: addDraft,
    sample: function () { ui.ocrText = Parser.SAMPLE; ui.draft = []; ui.scanMsg = ""; render(); },
    size: function (d) { S.size = +d.v; persist(); render(); },
    themeSet: function (d) { S.theme = d.v === "auto" ? null : d.v; persist(); render(); },
    voice: function () { S.voice = !S.voice; persist(); render(); },
    notifPerm: function () {
      if (!window.Notification) { toast(t("notifNo")); return; }
      Notification.requestPermission().then(function (p) { toast(p === "granted" ? t("notifOk") : t("notifNo")); });
    },
    share: function () {
      var text = t("report") + "\n" + week().map(function (r) { return r.label + ": " + r.n + "/" + r.tot; }).join("\n");
      if (navigator.share) navigator.share({ text: text }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast(t("copied")); });
    },
    disc: function () { S.discMin = !S.discMin; persist(); renderChrome(); var b = $("#disc button"); if (b) b.focus(); },
    readHelp: function () { speak(window._helpText); },
    readAlert: function () { speak(window._alertText); },
    alertTaken: function (d) { mark(d.k, true); closeModal(); }
  };

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el) return;
    var fn = actions[el.dataset.act]; if (fn) fn(el.dataset, el);
  });
  document.addEventListener("input", function (e) {
    var el = e.target;
    if (el.dataset.hint) updateHint(el);
    if (el.dataset.set) {
      var v = el.value, key = el.dataset.set;
      if (key === "grace") S.grace = Math.max(5, +v || 30);
      else if (key === "cg.name") S.cg.name = v; else if (key === "cg.phone") S.cg.phone = v; else if (key === "sos") S.sos = v;
      persist();
    }
    if (el.dataset.draft) { ui.draft[+el.dataset.i][el.dataset.draft] = el.value; if (el.dataset.draft === "timesText") { ui.draft[+el.dataset.i].inferred = false; var c = document.getElementById("d_c" + el.dataset.i); if (c) c.hidden = true; } }
  });
  document.addEventListener("change", function (e) {
    var el = e.target;
    if (el.id === "photo" && el.files[0]) { file = el.files[0]; if (ui.imgURL) URL.revokeObjectURL(ui.imgURL); ui.imgURL = URL.createObjectURL(file); var ta = $("#ptxt"); if (ta) ui.ocrText = ta.value; render(); }
    if (el.dataset.draft && el.tagName === "SELECT") ui.draft[+el.dataset.i][el.dataset.draft] = el.value;
    if (el.dataset.draft === "freq") { var w = document.getElementById("d_wk" + el.dataset.i); if (w) w.hidden = el.value !== "weekly"; }
    if (el.id === "f_f") $("#f_wk").hidden = el.value !== "weekly";
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && ui.modal) closeModal(); });

  $("#lang").addEventListener("change", function (e) { S.lang = e.target.value; persist(); render(); });
  $("#btnSize").addEventListener("click", function () { S.size = (S.size + 1) % 3; persist(); render(); });
  $("#btnTheme").addEventListener("click", function () { S.theme = effectiveDark() ? "light" : "dark"; persist(); render(); });
  $("#btnHelp").addEventListener("click", showHelp);
  $("#btnSos").addEventListener("click", function () {
    if (S.sos) location.href = "tel:" + S.sos.replace(/[^\d+]/g, ""); else { toast(t("nosos")); ui.tab = "more"; render(); }
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { if (!S.theme) render(); });

  render();
  setInterval(tick, 15000);
  if (!S.seenGuide) showHelp();
  try { if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) navigator.serviceWorker.register("sw.js").catch(function () {}); } catch (e) {}
})();
