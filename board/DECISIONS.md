# Decisions — LectureLens

> ADR-lite: 3 lines per entry, 30 seconds to write, saves the 2am "why is it like this".
> Log: irreversible choices, contract/schema changes, pivots, Direction Checks overruled.

---

### 1 · Idea: LectureLens + Scale Gate: QUICK              2026-09-20 12:45 IST · by team
CHOSE: LectureLens (composite A+C+F from gauntlet) — teacher-initiated multimodal on-device AI lecture companion with adaptive quizzing. Scale gate: QUICK (30h hackathon, 3 builders).
BECAUSE: Scored 8.6/10 on iQOO rubric. Hits all 6 scoring dimensions. Multimodal (audio+board) + adaptive quiz + on-device is the OPEN GAP no competitor fills. 3 builders + 30h → QUICK mode mandatory.
AFFECTS: All tracks. PRD vocabulary frozen. Demo narrative locked (7 beats). MUST items M1–M10 assigned.

### 2 · Demo User: Suresh (student-first story)             2026-09-20 12:44 IST · by team
CHOSE: Suresh, final-year CSE student at JNTU Hyderabad, as the primary demo persona. Teacher (Prof. Raghav) is the secondary user.
BECAUSE: Student pain ("pending notes") is more emotionally resonant for judges than teacher productivity gains. Suresh's story is concrete, relatable, and demonstrates end-to-end value.
AFFECTS: Demo narrative, UI flow (student-view is the hero screen), pitch script.

### 3 · Target: Hyderabad City Battle                       2026-09-20 12:44 IST · by team
CHOSE: Hyderabad city battle (upcoming weekend). Sat 08:00 check-in → Sun 17:00 awards. 30-hour format.
BECAUSE: Home city advantage, familiar campus/infra context for the "engineering college" story.
AFFECTS: Freeze calendar computed. Skeleton deadline = Sat 17:00. Submission by Sun 15:00.

### 4 · Stack: React Native + On-Device AI                   2026-09-21 18:50 IST · by Orion
CHOSE: React Native (Expo) + TypeScript | SQLite (expo-sqlite) | Whisper Small via whisper.rn (QNN/NPU) | Phi-4-mini Q4_K_M via llama.cpp | ML Kit OCR | ts-fsrs | No backend — fully on-device. APK sideload for demo.
BECAUSE: Cross-platform iteration speed (3 builders, 30h) + offline-only constraint eliminates server need. Whisper Small is the accuracy sweet spot for Indian English on Snapdragon 8 Gen 5. Phi-4-mini best instruction-following at 3.8B. SQLite is zero-config, ships with Expo.
AFFECTS: All tracks. No deploy infra needed. Models pre-loaded on device (~2.5GB total). FE/AI-Pipeline/Quiz+Analytics are the 3 tracks.

### 5 · PIVOT: Hybrid Online — Firebase + Cloudinary         2026-09-21 19:15 IST · by Orion
CHOSE: Add cloud backend: Firebase Auth (teacher email/password; student anonymous + 6-digit class code) + Firestore (real-time sync, quiz sessions, performance) + Cloudinary (audio, board photos, PDFs — 25GB free tier). On-device AI (Whisper NPU + Phi-4-mini + ML Kit OCR) retained. New MUSTs: M11 cross-device quiz history, M12 audio playback. SQLite kept as local offline cache. Timeline extended from 30h to 6 days.
BECAUSE: Students need to take quizzes on any device from anywhere. Teachers need real-time class analytics as students submit. Cloudinary > Firebase Storage (25GB vs 5GB free, built-in image/PDF transforms). Class code join means students need no account or email. On-device AI kept as iQOO NPU differentiator.
AFFECTS: All tracks. ARCHITECTURE.md, SCHEMA.md, all 3 contracts — all rewritten to v2. New env vars needed: Firebase project config + Cloudinary cloud name + upload preset.
