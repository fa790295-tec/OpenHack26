/* speech.js - text-to-speech and speech-to-text wrappers with graceful fallbacks. */
(function (root) {
  "use strict";
  var TAGS = { en: "en-US", ur: "ur-PK", sd: "ur-PK" };

  /** Speak text in the given language. Returns "ok" | "fallback" | "unsupported". */
  function speak(text, lang) {
    if (!("speechSynthesis" in root)) return "unsupported";
    var u = new SpeechSynthesisUtterance(String(text).replace(/<[^>]+>/g, " "));
    var voices = speechSynthesis.getVoices();
    var v = voices.filter(function (x) { return x.lang.toLowerCase().indexOf(lang) === 0; })[0];
    var result = "ok";
    if (v) { u.voice = v; u.lang = v.lang; }
    else { u.lang = "en-US"; if (lang !== "en") result = "fallback"; }
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    return result;
  }

  function stop() { if ("speechSynthesis" in root) speechSynthesis.cancel(); }

  /** Start dictation. Calls onText(transcript). Returns false when unsupported. */
  function listen(lang, onText, onError) {
    var R = root.SpeechRecognition || root.webkitSpeechRecognition;
    if (!R) return false;
    var r = new R();
    r.lang = TAGS[lang] || "en-US";
    r.onresult = function (e) { onText(e.results[0][0].transcript); };
    r.onerror = function () { if (onError) onError(); };
    r.start();
    return true;
  }

  root.Speech = { speak: speak, stop: stop, listen: listen };
})(window);
