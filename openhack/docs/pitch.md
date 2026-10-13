# MedAssist: pitch outline (HT-01)

1. **Problem.** People on long-term medication miss doses because they forget the schedule or cannot understand the prescription, especially when it is not in their language.
2. **Root cause.** Prescriptions are handwritten and abbreviated (BD, TDS, 1-0-1), rarely available in Urdu or Sindhi, and no simple tool turns them into reminders an older adult can use.
3. **Solution.** MedAssist reads a prescription photo, turns it into an editable schedule in English, Urdu or Sindhi, reminds the patient, tracks doses, and can message a caregiver when a dose is missed.
4. **Technology.** Browser OCR (Tesseract.js), rule-based prescription parser, scheduling engine, Web Notifications, Speech Synthesis and Recognition, installable PWA.
5. **Target audience.** Older adults on long-term medication, and the family members who look after them, with a focus on Urdu and Sindhi speakers.
6. **MVP and scope.** Upload and OCR with manual correction; editable schedule with reminders; dose tracking; optional missed-dose caregiver message. It never invents or changes a dose.
7. **Impact.** Fewer missed doses, fewer preventable complications, and less worry for caregivers.
8. **Success metrics.** Doses taken on time (%); share of OCR fields users had to correct; missed-dose alerts acted on; task success and satisfaction in a short test with older users.
