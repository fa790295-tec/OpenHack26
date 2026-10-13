# MedAssist

Medication reminders in English, Urdu and Sindhi, designed for older adults and their caregivers.
Built for the HealthTech challenge HT-01 (Multilingual Medication Adherence Assistant).

## What it does
- Reads a prescription photo with OCR, or accepts typed or pasted text, then proposes medicines for the user to **review and correct** before anything is saved.
- Builds an editable schedule. Times are shown in 12-hour format and accepted as 12-hour or 24-hour.
- Weekly medicines (for example a tablet once a week on Monday) and limited courses (for example 3 days, then it stops). Course day is shown ("Day 2 of 3"), a finished course drops off Today, and the weekly report only counts doses actually scheduled that day.
- Today view with a day tray (morning, afternoon, night), next-dose card, mark as taken with undo, refill warnings.
- Full-screen reminders with snooze, escalation, vibration, spoken reminder and browser notification.
- Optional missed-dose message to a caregiver through a pre-filled WhatsApp link (no external service).
- 7-day adherence report with share.

## Accessibility choices
- Atkinson Hyperlegible typeface (designed for low vision), three text sizes, light and dark themes, all text at 4.5:1 contrast or better.
- 56 px touch targets, no swipe-only or timed actions, status always shown with icon and word, never colour alone.
- Read-aloud (speech synthesis) and dictation (speech recognition) with graceful fallback when a language voice is missing.
- Enlarge button shows any medicine in giant text. Prescription photo supports tap-to-zoom.
- Right-to-left layout for Urdu and Sindhi, keyboard focus outlines, ARIA roles, reduced-motion support.

## Safety
MedAssist only copies what the prescription says. It never decides, suggests or changes a dose. Frequencies such as "twice daily" or "once weekly" produce *suggested* clock times (and a weekday, if none is written) that are flagged and must be confirmed. Course length and weekday are copied only when the prescription states them. Deleting asks for confirmation.

## Run it
- Open `index.html` directly, or serve the folder: `python3 -m http.server 8000` and visit http://localhost:8000
- Deploy: drag the folder onto Netlify Drop, or enable GitHub Pages. On a phone choose "Add to Home Screen" to install it.
- Tests: `node tests/core.test.js` (no dependencies).

## Project structure
```
index.html          page shell and icon sprite
css/styles.css      design tokens, layout, components
js/core.js          time parsing and formatting, dose status (pure, tested)
js/parser.js        prescription text to draft medicines (pure, tested)
js/i18n.js          English, Urdu and Sindhi strings
js/speech.js        text-to-speech and dictation wrappers
js/app.js           state, views, events, reminder loop
sw.js, manifest.json, icon-*.png    offline install support
tests/core.test.js  unit tests
docs/               pitch outline and flow diagram
```
Data is stored in the browser (`localStorage`) under `medassist.v2`.

## Known limits
- Reminders fire only while the app is open. Background push needs a server.
- OCR reads English print. Urdu and Sindhi OCR and handwriting need a server-side engine or a vision model.
- Data does not sync across devices.
- Urdu and Sindhi interface text should be reviewed by a native speaker. Speech voices for these languages depend on the device.
- Not a medical device. Always confirm medicines with a doctor or pharmacist.
