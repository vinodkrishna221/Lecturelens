# Contract: Note Distribution                version: 2

> OWNER: FE track (Nova) · CONSUMERS: AI-Pipeline track (Sage), Quiz+Analytics track
> v2 CHANGE: Replaced local QR/HTTP bundle approach with Firestore real-time sync.
> Notes are now published to Firestore; students receive them via onSnapshot listener.
> NoteBundle format replaced by Firestore Note document (see SCHEMA.md).
> Change ritual: edit → bump version + changelog → DECISIONS entry → ping consumers → THEN code.

## Distribution Model (v2 — Firestore Real-Time)

In v2, note distribution is **event-driven via Firestore**, not peer-to-peer:

```
Teacher taps "Share to Class"
  → Firestore: notes/{noteId}.status = "shared"
  → All student phones with onSnapshot listener on classes/{classCode}/notes
  → Instantly receive the note update
  → Note appears on student screen with Cloudinary CDN media (audio, diagram, PDF)
```

Students **do not need to scan a QR code** or be on the same network. They receive
notes anywhere they have internet, on any device, logged into the same class code.

---

## Module Interface

---

### `publishNote(input: PublishNoteInput): Promise<void>`

Called on teacher's device after note generation + Cloudinary upload completes.
Writes the complete Note document to Firestore and triggers real-time delivery to all students.

**Input — `PublishNoteInput`:**
```typescript
{
  lectureId: string;
  classCode: string;
  title: string;
  subject: string | null;
  teacherUid: string;
  markdownContent: string;
  summary: string;
  keyTopics: string[];
  audioUrl: string;           // Cloudinary CDN URL
  boardPhotoUrl: string | null;
  diagramUrls: string[];
  pdfNoteUrl: string | null;
  quizSeed: {
    easy: QuizQuestion[];
    medium: QuizQuestion[];
    hard: QuizQuestion[];
  };
}
```

**Output:** `void` — Firestore write resolves when data is committed.

**Errors:**
```typescript
{ code: "FIRESTORE_WRITE_FAILED", message: "Failed to publish note: {firestoreError}" }
{ code: "UNAUTHORIZED", message: "Only the class teacher can publish notes" }
{ code: "MISSING_AUDIO_URL", message: "Audio must be uploaded before publishing" }
```

---

### `subscribeToNotes(classCode: string, callback: (notes: Note[]) => void): Unsubscribe`

Called on student's device after joining class. Sets up a Firestore `onSnapshot` listener.
Returns an unsubscribe function (call on screen unmount).

**Input:**
```typescript
classCode: string
callback: (notes: Note[]) => void   // called immediately with cached data, then on every update
```

**Output:** `() => void` — unsubscribe function

**Behaviour:**
- Firestore offline persistence ensures notes are available even without internet
- New notes from teacher appear on student screen within ~1 second of teacher tapping "Share"
- `notes` array is ordered by `createdAt DESC` (latest first)

**Errors:** Firestore SDK handles reconnects automatically. FE shows offline banner if disconnected > 5s.

---

### `joinClass(input: JoinClassInput): Promise<JoinResult>`

Called when a student enters a class code and their name. No email or password needed.

**Input — `JoinClassInput`:**
```typescript
{
  classCode: string;     // 6-digit code, e.g. "BST101"
  studentName: string;   // display name entered by student
}
```

**Output — `JoinResult`:**
```typescript
{
  success: boolean;
  studentId: string;       // Firebase anonymous UID (persisted on device)
  classCode: string;
  teacherName: string;     // pulled from class doc for welcome screen
  existingStudent: boolean; // true if this device has joined this class before
}
```

**Example:**
```json
{
  "success": true,
  "studentId": "anon-uid-suresh",
  "classCode": "BST101",
  "teacherName": "Prof. Raghav",
  "existingStudent": false
}
```

**Errors:**
```typescript
{ code: "CLASS_NOT_FOUND", message: "No class with code: {classCode}" }
{ code: "INVALID_CLASS_CODE", message: "Class code must be 6 characters" }
{ code: "AUTH_FAILED", message: "Firebase anonymous sign-in failed: {error}" }
```

**Notes:** Firebase `signInAnonymously` creates a persistent anonymous session. The anonymous UID is the student's identity across sessions on the same device. If the student switches to a new device and enters the same class code + name, a new UID is created but their historical performance is preserved under the old UID — acceptable for hackathon scope.

---

### `downloadNoteForOffline(noteId: string, classCode: string): Promise<void>`

Explicitly caches a note (Markdown + media) for offline access. Firestore SDK auto-caches
reads, but this function pre-fetches Cloudinary media to device storage.

**Input:** `noteId: string`, `classCode: string`

**Output:** `void` — resolves when note + media are cached locally

**Errors:**
```typescript
{ code: "NOTE_NOT_FOUND", message: "Note not found: {noteId}" }
{ code: "NETWORK_ERROR", message: "Media download requires internet connection" }
```

---

## Share Mechanisms (v2 — simplified)

| Method | How | Priority |
|---|---|---|
| **Firestore onSnapshot** | Teacher taps "Share" → Firestore write → student screens update in < 1s automatically | 🥇 Primary (always works, any network) |
| **PDF via Cloudinary URL** | Teacher taps "Export PDF" → WhatsApp / email share of Cloudinary PDF URL | 🥈 For parents, print rooms, students without app |
| **Office Kit Screen Mirror** | Teacher mirrors note display to laptop/projector via Office Kit for classroom display | 🥉 Classroom projection for real-time class display |

> **QR code sharing (v1) is removed.** Not needed — Firestore handles distribution automatically.
> Students only need to join the class once (class code) and receive all future notes automatically.

---

## Types

```typescript
// Note shape as returned by subscribeToNotes callback
interface Note {
  id: string;
  lectureId: string;
  classCode: string;
  title: string;
  subject: string | null;
  markdownContent: string;
  summary: string;
  keyTopics: string[];
  audioUrl: string;
  boardPhotoUrl: string | null;
  diagramUrls: string[];
  pdfNoteUrl: string | null;
  quizSeed: {
    easy: QuizQuestion[];
    medium: QuizQuestion[];
    hard: QuizQuestion[];
  };
  version: number;
  createdAt: string;   // ISO-8601
}

// QuizQuestion — same as ai-pipeline.md contract
```

## Events (Firestore real-time — not custom events)

`classes/{classCode}/notes onSnapshot` — fires when:
- New note published by teacher
- Note updated (e.g., diagram URL added after Cloudinary upload completes)

Consumed by: FE (student home screen — new note banner + notification)

`classes/{classCode}/students onSnapshot` — fires when:
- New student joins the class

Consumed by: FE (teacher view — "Suresh joined the class" toast)

---

## Changelog

- v2 2026-09-21: Complete rewrite. Replaced QR/local HTTP bundle with Firestore real-time distribution. Added joinClass, subscribeToNotes, downloadNoteForOffline. Removed NoteBundle format (replaced by Firestore Note doc in SCHEMA.md).
- v1 2026-09-21: initial — exportNoteBundle, importNoteBundle, local HTTP + QR share
