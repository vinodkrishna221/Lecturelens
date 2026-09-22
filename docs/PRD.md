# PRD — LectureLens

> Scale gate: **QUICK** · Hackathon: iQOO Challenge — Hyderabad City Battle (30h, Sat 08:00 → Sun 17:00)
> Skeleton deadline (30%): **Sat 17:00** (hour 9 of 30)
> Vocabulary freeze: the nouns below are final across code, schema, UI, pitch.

## 1 · Problem

Indian engineering college teachers spend **25–40% of every lecture period** dictating notes or waiting for students to copy from the board. Students who fall behind accumulate "pending notes" and waste study time on rote transcription instead of revision — a cycle that compounds into poor conceptual understanding and syllabus crunches. India's NEP 2020 explicitly mandates eliminating this rote-copying model, but no existing tool solves it end-to-end, offline, on a phone.
[Source: Cognitive Load Theory / Sweller; Mueller & Oppenheimer; British Council TeachingEnglish; NEP 2020]

## 2 · User & Core Loop

**The demo user:** Suresh, final-year CSE student at JNTU Hyderabad. Always has 3 subjects' worth of pending notes. Copies notebooks during library hours instead of solving placement problems.

**Core loop:**
- **Does →** Opens LectureLens as class starts; teacher's phone is recording + capturing the board
- **Gets →** Structured notes with diagrams appear on his phone by end of class; taps "Quiz" and gets questions calibrated to his level
- **Returns because →** His notes are always complete (zero pending), quizzes adapt to build his confidence, and his performance dashboard shows visible improvement

**Secondary user (teacher-side):** Prof. Raghav, 2nd-year DSA faculty. Places his iQOO phone on the podium, taps Record, teaches normally, takes one board photo when the derivation is complete. After class, structured notes are auto-shared to 60 students. He sees a class comprehension dashboard via Office Kit on his laptop.

## 3 · Demo Narrative (this section IS the feature list)

| Beat | Time | Judge Sees | Powered by (MUST ↓) |
|---|---|---|---|
| 1 · Setup | 0:00–0:20 | "Meet Suresh — final year CSE, always behind on notes." Show the problem: messy borrowed notebooks, missed concepts. Open LectureLens on teacher's phone. | App UI (Teacher Mode) |
| 2 · Live Capture | 0:20–0:50 | Teacher speaks into iQOO mic for ~25 seconds about "Binary Search Trees." A whiteboard has a BST diagram + time complexity written on it. Teacher taps camera → snaps the board. | On-device Whisper STT + Camera capture |
| 3 ⭐ WOW — "The Board Comes Alive" | 0:50–1:20 | Phone screen transforms: structured Markdown notes appear with the BST diagram embedded inline, spoken explanation organized around it. Office Kit mirrors this to the laptop/projector in real-time. | On-device SLM (note structuring) + OCR/diagram merge + Office Kit mirror |
| 4 · Share to Class | 1:20–1:40 | Teacher taps "Share" → Suresh's phone buzzes. He opens and sees the complete notes with diagram. Zero effort, zero pending. | Note distribution (QR / link / push) |
| 5 · Adaptive Quiz | 1:40–2:20 | Suresh taps "Quiz." Gets 3 questions on BSTs — starting easy (confidence builder), ramping based on answers. Gets one wrong → next question targets that gap, slightly easier. Visual progress bar + streak animation. | FSRS-based adaptive quiz engine + flow-state difficulty curve |
| 6 · Analytics | 2:20–2:50 | Split screen: Suresh sees his personal dashboard (strengths, gaps, progress). Teacher sees class-wide analytics on the laptop via Office Kit: "72% got Q2 wrong — review BST deletion next class." | Performance analytics dashboard + Office Kit |
| 7 · Close | 2:50–3:00 | "LectureLens. Zero pending notes. Quizzes that meet you where you are. All on-device, zero internet, running on the iQOO's Snapdragon NPU." | Pitch close |

## 4 · Scope

**MUST** (walking skeleton + wow machinery — every item maps to a beat):
- [ ] **M1** Teacher-mode app: Record button + audio capture via phone mic → Beat 1, 2
- [ ] **M2** On-device Whisper STT (Snapdragon NPU): audio → transcript → Beat 2, 3
- [ ] **M3** On-device SLM (Phi/Gemma/Qwen quantized): transcript → structured Markdown notes → Beat 3
- [ ] **M4** Camera capture: board photo → OCR → diagram extraction → merge with notes → Beat 3
- [ ] **M5** Note display UI: rendered Markdown with embedded diagrams on student's phone → Beat 4
- [ ] **M6** Note sharing: teacher → all students (QR code / class link / local share) → Beat 4
- [ ] **M7** Adaptive quiz engine: FSRS-based, 3-tier difficulty, flow-state ramping → Beat 5
- [ ] **M8** Student performance dashboard: strengths, gaps, progress chart → Beat 6
- [ ] **M9** Teacher analytics dashboard: class-wide comprehension summary → Beat 6
- [ ] **M10** Office Kit integration: mirror notes + analytics to laptop/projector → Beat 3, 6

**SHOULD** (if time; pre-ranked):
1. Real-time streaming transcript (live captions during lecture, not just post-processing)
2. Multiple board photo capture & auto-merge into timeline
3. Quiz question bank export (PDF/share to WhatsApp)

**CUT LIST** (born ranked; scope-guard executes top-down at T-3h):
1. Real-time live captions — saves 4h (post-process is sufficient for demo)
2. Multi-language / Hinglish support — saves 3h (demo in clear English)
3. Student accounts / login system — saves 2h (demo with pre-seeded profiles)
4. Cloud sync / backup — saves 2h (on-device only for hackathon)
5. Teacher analytics dashboard (M9) — saves 2h (can show mock data or cut entirely)

**NON-GOALS** (we will not build, on purpose):
- Chat/doubt-asking chatbot (BANNED — consensus idea #1)
- PDF upload / RAG system (BANNED — consensus idea #2)
- Attendance system (BANNED — consensus idea #11)
- Video recording / lecture replay (bloat; audio + board photo is sufficient)
- Multi-class / school management system (enterprise scope, not a 30h build)

## 5 · Success =

Wow moment **"The Board Comes Alive"** lands live during the 3-minute pitch · three retellable phrases:
1. **"Zero pending notes, ever."** (spine)
2. **"The Board Comes Alive."** (wow-moment name)
3. **"Runs on-device — no internet, no subscription, just the phone."** (tech differentiator)

Submission complete by **T-2h (Sun 15:00)** · skeleton walking by **Sat 17:00** (hour 9).
