# LectureLens — Idea Submission Video Script
## Team Maxzi · iQOO Hackathon · Smart Education Track
### Duration: 3 minutes · Format: Talking head (one speaker) + app mockup B-roll

---

> **SPEAKER NOTES FORMAT:**
> - `[BEAT]` = pause for emphasis (1–2 seconds)
> - `[B-ROLL]` = cut to this visual behind or beside speaker
> - `[TONE]` = acting direction
> - Word count: ~420 words · Speaking pace: ~140 wpm = 3 min 00 sec

---

## 🎬 SECTION 1 — THE HOOK (0:00 – 0:25)
### *Judge goal: Feel the problem. Score: End Product Quality (30%), Novelty (20%)*

**[B-ROLL: A messy notebook, student frantically copying, clock ticking]**

[TONE: calm, direct, like you're telling a friend something important]

> "Picture this. A student walks into a Data Structures class. The teacher begins writing on the board — diagrams, derivations, time complexities. And for the next 45 minutes... the student is not learning. They're *copying*."

[BEAT]

> "Studies show that **25 to 40 percent** of every lecture period in Indian colleges is spent on dictation — not comprehension. Students enter what researchers call *stenographer mode*. They copy. They don't understand."

[BEAT]

> "And it doesn't stop at class. They borrow notebooks in the library. They copy pending notes over the weekend. They reach exam week with gaps they never filled — because they were too busy transcribing."

[BEAT]

> "India's NEP 2020 explicitly mandates eliminating rote copying. The policy exists. The solution doesn't. Until now."

---

## 🎬 SECTION 2 — THE SOLUTION (0:25 – 1:05)
### *Judge goal: See the idea clearly. Score: End Product Quality (30%), Creative Phone Use (15%)*

**[B-ROLL: iQOO phone on a podium, teacher's hand tapping Record]**

[TONE: confident, excited — you're showing them something new]

> "Meet **LectureLens**. Built by **Team Maxzi** for the iQOO Smart Education Track."

[BEAT]

> "Here is how it works."

> "The teacher places their **iQOO phone** on the podium and taps **Record**. That's it. They teach normally."

**[B-ROLL: Phone screen showing audio waveform + "Recording" indicator]**

> "The iQOO's **Snapdragon 8 Gen 3** — with its **Hexagon NPU** — runs **Whisper**, an advanced speech-to-text model, entirely **on-device**. No cloud. No internet. No subscription. The phone listens, transcribes, and understands — in real time."

**[B-ROLL: Teacher snapping a board photo, then the phone screen transforming]**

> "At any point, the teacher snaps a photo of the whiteboard. Our **on-device OCR** reads the diagram, the equations, the derivations — and our on-device language model, **Phi-4-mini**, merges the spoken explanation with the board content..."

[BEAT]

> "...into **structured, beautiful Markdown notes** — with the diagram embedded inline — in under **10 seconds**."

---

## 🎬 SECTION 3 — THE WOW MOMENT (1:05 – 1:35)
### *Judge goal: Jaw drop. Score: Demo & Presentation (10%), Novelty (20%), Technical Depth (15%)*

**[B-ROLL: Structured note appearing on phone screen — clean headings, embedded diagram, time complexity table]**

[TONE: let the moment breathe — slower pace here]

> "The board comes alive."

[BEAT — 2 seconds]

> "Spoken explanation. Written diagram. Merged into one complete note. On a phone. With zero internet."

[BEAT]

**[B-ROLL: Phone connected to laptop via Office Kit — same note mirroring on laptop screen]**

> "Through **iQOO's Office Kit**, this note mirrors to the teacher's laptop — and straight to the **classroom projector** — in real time. The entire class sees the structured note as it's being generated."

[BEAT]

> "Then the teacher taps **Share to Class**."

**[B-ROLL: QR code flash / Firestore sync animation / student phone buzzes]**

> "Every student's phone receives the complete note instantly — via **Firebase Firestore real-time sync**. Suresh, our final-year CSE student who's always behind on notes... opens his phone and sees every concept, every diagram, every derivation — complete, structured, and ready to study. Zero pending notes. Ever."

---

## 🎬 SECTION 4 — ADAPTIVE QUIZ ENGINE (1:35 – 2:10)
### *Judge goal: See depth + stickiness. Score: End Product Quality (30%), Technical Depth (15%)*

**[B-ROLL: Student tapping "Quiz Me" button, first question appearing]**

[TONE: energetic, like showing a game]

> "But LectureLens doesn't just stop at notes."

> "Suresh taps **Quiz Me**. He gets three questions — built by the same on-device AI — calibrated to his exact level."

**[B-ROLL: First question — easy, student gets it right, streak animation fires]**

> "He gets the first one right. Streak of one. The next question is slightly harder. He gets that right too. The difficulty ramps up — like a game that always keeps you **in the flow state**. Never too easy. Never too scary."

**[B-ROLL: Wrong answer — question drops back to easier topic, explanation appears]**

> "He gets one wrong. The app drops the difficulty, targets that exact concept, and shows a micro-explanation. The **FSRS spaced repetition algorithm** — the same science used by Anki — schedules this concept for review tomorrow, and the day after."

**[B-ROLL: Teacher's screen — live bar chart updating as students submit answers]**

> "And the teacher? They see the class analytics update **live** as students submit — powered by Firestore real-time sync. Right there it says: **72% of students struggled with BST Deletion. Review it next class.**"

---

## 🎬 SECTION 5 — TECH STACK CREDIBILITY (2:10 – 2:35)
### *Judge goal: Technical depth confirmed. Score: Technical Depth (15%), Creative Phone Use (15%), Office Kit (10%)*

**[B-ROLL: Architecture diagram — phone NPU → Firestore → student phones]**

[TONE: credible, precise — like a senior engineer, not a student reading slides]

> "Under the hood: **Whisper Small** runs on the Snapdragon NPU via QNN — the speech model never touches a server. **Phi-4-mini**, a 3.8 billion parameter model quantized to 4-bit, structures your notes entirely on-device using llama.cpp. **Google ML Kit** reads the whiteboard. All AI is on the iQOO."

> "Notes, quiz sessions, and student performance sync to **Firebase Firestore** in real time. Audio recordings and board photos are stored on **Cloudinary** — 25 gigabytes free — so students can replay the lecture from any device, anywhere."

> "**iQOO Office Kit** bridges the phone to the classroom projector — and HackTracker records every use of the microphone, camera, NPU, and Office Kit session."

---

## 🎬 SECTION 6 — CLOSE (2:35 – 3:00)
### *Judge goal: Remember us. Score: Demo & Presentation (10%), Novelty & Impact (20%)*

**[B-ROLL: Split screen — Suresh's phone with complete notes + teacher's laptop with class analytics]**

[TONE: quiet, confident — land the three phrases]

> "LectureLens is not a transcription app. It's not a chatbot. It's not another PDF summarizer."

[BEAT]

> "It is a **classroom operating system** — where the teacher's iQOO phone is the only brain in the room. Every student gets complete notes. Every quiz adapts to their level. Every teacher sees what the class didn't understand."

[BEAT]

> "Three phrases to remember us by:"

[BEAT]

> "**Zero pending notes. Ever.**"

[BEAT]

> "**The board comes alive.**"

[BEAT]

> "**Runs on-device — no internet, no subscription, just the phone.**"

[BEAT — slow smile]

> "Team **Maxzi**. LectureLens. Smart Education Track."

[BEAT]

> "Thank you."

---

## 📋 PRODUCTION NOTES (for the person recording)

### Shot setup
- **Background:** Clean, neutral wall or a classroom whiteboard. Nothing busy.
- **Lighting:** Face-lit (ring light or window light from the front — not behind you).
- **Frame:** Chest-up. Speaker in the left third of the frame — right side reserved for B-roll overlays.
- **Dress:** Smart casual — collar recommended. Team Maxzi t-shirt if you have one.

### B-Roll assets needed (create before recording)
1. **Mockup screens** (Figma / draw.io) of:
   - Teacher mode: Record button, audio waveform
   - "Board comes alive" moment: structured Markdown note with embedded diagram
   - Student quiz screen with difficulty animation
   - Teacher analytics dashboard with live bar chart
2. **Architecture diagram** (from ARCHITECTURE.md mermaid block — export as PNG)
3. **Office Kit screenshot** — phone screen mirroring to laptop

### Timing guide
| Section | Time | Seconds |
|---|---|---|
| Hook (problem) | 0:00–0:25 | 25s |
| Solution overview | 0:25–1:05 | 40s |
| Wow moment | 1:05–1:35 | 30s |
| Quiz engine | 1:35–2:10 | 35s |
| Tech credibility | 2:10–2:35 | 25s |
| Close | 2:35–3:00 | 25s |

### Key phrases to NOT rush (let these land)
- *"The board comes alive."* — pause 2 seconds before and after
- *"Zero pending notes. Ever."* — pause between every word
- *"No internet, no subscription, just the phone."* — slow and clear

---

## 🎯 RUBRIC COVERAGE MAP

| Judge Criterion | Weight | Where It's Covered in Script |
|---|---|---|
| End Product Quality | 30% | Section 2 (full flow), Section 4 (quiz + analytics), Section 6 (use case clarity) |
| Novelty & Impact | 20% | Section 1 (NEP 2020 mandate), Section 3 (wow moment framing), Section 6 (3 phrases) |
| Creative Phone Use | 15% | Section 2 (mic + NPU), Section 3 (camera + OCR + Office Kit), Section 5 (explicit tech callout) |
| Technical Depth | 15% | Section 5 (Whisper QNN, Phi-4-mini llama.cpp, Firestore, Cloudinary) |
| Office Kit Usage | 10% | Section 3 (Office Kit mirror moment), Section 5 (HackTracker callout) |
| Demo & Presentation | 10% | 3 closing phrases designed to be retellable; paced with beats; TED-style structure |
