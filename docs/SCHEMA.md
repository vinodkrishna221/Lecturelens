# Schema — LectureLens (v2 — Online Pivot)

> Store: **Firestore** (primary, real-time sync) + **SQLite** (local offline cache)
> PRD nouns verbatim · IDs are Firestore document IDs (strings at contract boundary)
> Dates are ISO-8601 strings · Media files stored on **Cloudinary**, URLs in Firestore docs.

---

## Firestore Collection Structure

```
/users/{userId}                        ← Teacher accounts (Firebase Auth UID)
/classes/{classCode}                   ← A teacher's class
/classes/{classCode}/students/{studentId}   ← Students in the class
/classes/{classCode}/lectures/{lectureId}   ← Lectures recorded by the teacher
/classes/{classCode}/notes/{noteId}         ← Structured note for a lecture
/classes/{classCode}/quizSessions/{sessionId}  ← A student's quiz attempt
/classes/{classCode}/performance/{studentId}_{topic}  ← Per-student per-topic stats
```

---

## User (collection: `/users`)

| Field | Type | Notes |
|---|---|---|
| uid | string | Firebase Auth UID (document ID) |
| email | string | Teacher's email |
| displayName | string | e.g., "Prof. Raghav" |
| role | string | Enum: `teacher` |
| classCode | string | 6-digit code for the teacher's class e.g., `"BST101"` |
| createdAt | string | ISO-8601 |

**Example document:**
```json
{
  "uid": "firebase-uid-raghav",
  "email": "raghav@jntu.ac.in",
  "displayName": "Prof. Raghav",
  "role": "teacher",
  "classCode": "BST101",
  "createdAt": "2026-09-21T08:00:00+05:30"
}
```

**Demo queries → index:**
- Lookup teacher by class code: `Collection Group query on classCode` or direct doc fetch

---

## Student (sub-collection: `/classes/{classCode}/students`)

| Field | Type | Notes |
|---|---|---|
| id | string | Firestore document ID (also Firebase anonymous UID) |
| name | string | Student's display name (entered when joining class) |
| avatarEmoji | string | e.g., `"🎯"` |
| classCode | string | Denormalized for easy queries |
| overallAccuracy | number | 0.0–1.0, updated after each quiz |
| totalQuizzes | number | Lifetime quiz count |
| streakDays | number | Consecutive days with ≥ 1 quiz |
| joinedAt | string | ISO-8601 |

**Example document:**
```json
{
  "id": "anon-uid-suresh",
  "name": "Suresh",
  "avatarEmoji": "🎯",
  "classCode": "BST101",
  "overallAccuracy": 0.72,
  "totalQuizzes": 14,
  "streakDays": 3,
  "joinedAt": "2026-09-21T08:00:00+05:30"
}
```

**Demo queries → index:**
- Class leaderboard: `orderBy('overallAccuracy', 'desc')` → composite index on `(classCode, overallAccuracy DESC)`

---

## Lecture (sub-collection: `/classes/{classCode}/lectures`)

| Field | Type | Notes |
|---|---|---|
| id | string | Firestore document ID |
| classCode | string | Parent class |
| title | string | Auto-generated from first line of transcript |
| subject | string | e.g., `"Data Structures"` |
| teacherUid | string | FK → users.uid |
| audioDurationSec | number | Duration of the recording |
| audioUrl | string | Cloudinary CDN URL for audio playback (nullable until upload complete) |
| boardPhotoUrl | string | Cloudinary CDN URL for board photo (nullable) |
| pdfNoteUrl | string | Cloudinary CDN URL for printable PDF export (nullable) |
| rawTranscript | string | Whisper output |
| boardOcrText | string | ML Kit OCR output (nullable) |
| status | string | Enum: `recording` → `processing` → `uploading` → `ready` → `shared` |
| uploadProgress | number | 0.0–1.0, Cloudinary upload progress |
| createdAt | string | ISO-8601 |
| updatedAt | string | ISO-8601 |

**Example document:**
```json
{
  "id": "lecture-bst-001",
  "classCode": "BST101",
  "title": "Binary Search Trees — Insertion & Deletion",
  "subject": "Data Structures",
  "teacherUid": "firebase-uid-raghav",
  "audioDurationSec": 180,
  "audioUrl": "https://res.cloudinary.com/lecturelens/video/upload/v1/lectures/bst-audio.wav",
  "boardPhotoUrl": "https://res.cloudinary.com/lecturelens/image/upload/v1/boards/bst-board.jpg",
  "pdfNoteUrl": "https://res.cloudinary.com/lecturelens/image/upload/fl_attachment/v1/notes/bst-note.pdf",
  "rawTranscript": "Today we'll look at binary search trees...",
  "boardOcrText": "BST Insert: O(log n)\nBST Delete: O(log n)",
  "status": "ready",
  "uploadProgress": 1.0,
  "createdAt": "2026-09-21T10:30:00+05:30",
  "updatedAt": "2026-09-21T10:32:15+05:30"
}
```

**Demo queries → index:**
- List lectures by class and date: composite index `(classCode, createdAt DESC)`
- Filter by subject: composite index `(classCode, subject, createdAt DESC)`

---

## Note (sub-collection: `/classes/{classCode}/notes`)

| Field | Type | Notes |
|---|---|---|
| id | string | Firestore document ID (usually same as lectureId) |
| lectureId | string | FK → lectures.id |
| classCode | string | Denormalized |
| markdownContent | string | Structured Markdown from SLM |
| diagramUrls | string[] | Array of Cloudinary CDN URLs for extracted diagrams |
| summary | string | 2-3 sentence summary |
| keyTopics | string[] | For quiz generation, e.g. `["BST insertion", "BST deletion"]` |
| audioUrl | string | Cloudinary CDN URL (mirrored from Lecture for student convenience) |
| quizSeed | object | Pre-generated questions `{ easy: QuizQuestion[], medium: QuizQuestion[], hard: QuizQuestion[] }` |
| version | number | Bumped if note is re-processed |
| createdAt | string | ISO-8601 |

**Example document:**
```json
{
  "id": "note-bst-001",
  "lectureId": "lecture-bst-001",
  "classCode": "BST101",
  "markdownContent": "# Binary Search Trees\n\n## Key Properties\n- Left subtree values < parent\n\n## From the Board\n![BST Diagram](https://res.cloudinary.com/lecturelens/image/upload/v1/boards/bst-board.jpg)\n\n| Operation | Average | Worst |\n|---|---|---|\n| Insert | O(log n) | O(n) |",
  "diagramUrls": ["https://res.cloudinary.com/lecturelens/image/upload/v1/boards/bst-board.jpg"],
  "summary": "BSTs maintain sorted order via left-smaller/right-larger invariant. O(log n) average for insert/delete.",
  "keyTopics": ["BST insertion", "BST deletion", "BST time complexity", "inorder traversal"],
  "audioUrl": "https://res.cloudinary.com/lecturelens/video/upload/v1/lectures/bst-audio.wav",
  "quizSeed": {
    "easy": [{ "id": "q1", "text": "Where are smaller values in a BST?", "type": "mcq", "options": ["Left", "Right", "Root", "Leaf"], "correctIndex": 0, "topic": "BST insertion", "difficulty": "easy" }],
    "medium": [{ "id": "q4", "text": "Worst case BST insert?", "type": "mcq", "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"], "correctIndex": 2, "topic": "BST time complexity", "difficulty": "medium" }],
    "hard": [{ "id": "q7", "text": "Which BST deletion case needs inorder successor?", "type": "mcq", "options": ["Leaf", "One child", "Two children", "Root"], "correctIndex": 2, "topic": "BST deletion", "difficulty": "hard" }]
  },
  "version": 1,
  "createdAt": "2026-09-21T10:32:15+05:30"
}
```

**Demo queries → index:**
- Notes for a class (student home): composite index `(classCode, createdAt DESC)`
- Student gets new note via `onSnapshot` on `classes/BST101/notes`

---

## QuizSession (sub-collection: `/classes/{classCode}/quizSessions`)

| Field | Type | Notes |
|---|---|---|
| id | string | Firestore document ID |
| studentId | string | FK → students.id |
| studentName | string | Denormalized for teacher dashboard |
| noteId | string | FK → notes.id |
| classCode | string | Denormalized |
| difficulty | string | Starting tier: `easy` / `medium` / `hard` |
| questions | QuizQuestion[] | Array of questions served |
| answers | StudentAnswer[] | Array of submitted answers (grows as student answers) |
| score | number | 0.0–1.0, computed on completion |
| fsrsData | object | FSRS card state for next-review scheduling |
| status | string | Enum: `in_progress` → `completed` |
| startedAt | string | ISO-8601 |
| completedAt | string | ISO-8601 (nullable) |
| createdAt | string | ISO-8601 |

**Example document:**
```json
{
  "id": "qs-suresh-bst-001",
  "studentId": "anon-uid-suresh",
  "studentName": "Suresh",
  "noteId": "note-bst-001",
  "classCode": "BST101",
  "difficulty": "easy",
  "questions": [
    { "id": "q1", "text": "Where are smaller values in a BST?", "type": "mcq", "options": ["Left", "Right", "Root", "Leaf"], "correctIndex": 0, "topic": "BST insertion", "difficulty": "easy" }
  ],
  "answers": [
    { "questionId": "q1", "selectedIndex": 0, "correct": true, "answeredAt": "2026-09-21T10:35:02+05:30" }
  ],
  "score": 0.67,
  "fsrsData": { "stability": 1.2, "difficulty": 5.5, "due": "2026-09-22T10:35:00+05:30", "reps": 1, "lapses": 1 },
  "status": "completed",
  "startedAt": "2026-09-21T10:34:50+05:30",
  "completedAt": "2026-09-21T10:35:30+05:30",
  "createdAt": "2026-09-21T10:34:50+05:30"
}
```

**Demo queries → index:**
- Teacher live dashboard (`onSnapshot`): composite index `(classCode, noteId, status)`
- Student quiz history: composite index `(classCode, studentId, createdAt DESC)`

---

## Performance (sub-collection: `/classes/{classCode}/performance`)

Document ID: `{studentId}_{topic}` (e.g., `anon-uid-suresh_BST insertion`)

| Field | Type | Notes |
|---|---|---|
| id | string | `{studentId}_{topic}` |
| studentId | string | FK → students.id |
| studentName | string | Denormalized |
| topic | string | Matches a keyTopic from Note |
| classCode | string | Denormalized |
| accuracy | number | 0.0–1.0 for this topic |
| totalAttempts | number | Questions answered on this topic |
| correctAttempts | number | Correct answers |
| lastAttemptAt | string | ISO-8601 |
| trend | string | Enum: `improving` / `stable` / `declining` |
| updatedAt | string | ISO-8601 |

**Example document:**
```json
{
  "id": "anon-uid-suresh_BST insertion",
  "studentId": "anon-uid-suresh",
  "studentName": "Suresh",
  "topic": "BST insertion",
  "classCode": "BST101",
  "accuracy": 0.85,
  "totalAttempts": 7,
  "correctAttempts": 6,
  "lastAttemptAt": "2026-09-21T10:35:02+05:30",
  "trend": "improving",
  "updatedAt": "2026-09-21T10:35:02+05:30"
}
```

**Demo queries → index:**
- Teacher class analytics: composite index `(classCode, topic, accuracy ASC)` → shows which topics entire class struggles with
- Student personal dashboard: composite index `(classCode, studentId, accuracy ASC)` → shows personal gaps

---

## Entity Relationship

```mermaid
erDiagram
    User ||--o{ Class : "creates (classCode)"
    Class ||--o{ Student : "has members"
    Class ||--o{ Lecture : "contains"
    Lecture ||--|| Note : "generates"
    Note ||--o{ QuizSession : "generates quiz for"
    Student ||--o{ QuizSession : "takes"
    Student ||--o{ Performance : "tracked per topic"

    User {
        string uid PK
        string email
        string displayName
        string role
        string classCode
    }

    Student {
        string id PK
        string name
        string classCode
        number overallAccuracy
        number totalQuizzes
        number streakDays
    }

    Lecture {
        string id PK
        string classCode
        string title
        string audioUrl
        string boardPhotoUrl
        string pdfNoteUrl
        string status
    }

    Note {
        string id PK
        string lectureId FK
        string markdownContent
        string audioUrl
        string[] keyTopics
        object quizSeed
    }

    QuizSession {
        string id PK
        string studentId FK
        string noteId FK
        string classCode
        string difficulty
        number score
        object fsrsData
        string status
    }

    Performance {
        string id PK
        string studentId FK
        string topic
        number accuracy
        string trend
    }
```

---

## Shared Types (TypeScript — `src/types/schema.ts`)

```typescript
type LectureStatus = 'recording' | 'processing' | 'uploading' | 'ready' | 'shared';
type QuizDifficulty = 'easy' | 'medium' | 'hard';
type QuizStatus = 'in_progress' | 'completed';
type PerformanceTrend = 'improving' | 'stable' | 'declining';

interface QuizQuestion {
  id: string;
  text: string;
  type: 'mcq';
  options: string[];       // exactly 4
  correctIndex: number;    // 0-based
  topic: string;           // matches a Note.keyTopics entry
  difficulty: QuizDifficulty;
}

interface StudentAnswer {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
  answeredAt: string;      // ISO-8601
}

interface FsrsData {
  stability: number;
  difficulty: number;
  due: string;             // ISO-8601 — when to next show this topic
  reps: number;
  lapses: number;
}
```

---

## Firestore Security Rules Outline

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    // Users: only the user themselves
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    // Classes: teacher owns, students can read/write their own data
    match /classes/{classCode} {
      // Teacher full access
      allow read, write: if get(/databases/$(db)/documents/users/$(request.auth.uid)).data.classCode == classCode;
      // Students: can read notes/lectures, write own quizSessions/performance
      match /notes/{noteId} { allow read: if request.auth != null; }
      match /lectures/{lectureId} { allow read: if request.auth != null; }
      match /quizSessions/{sessionId} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == resource.data.studentId;
      }
      match /performance/{perfId} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == resource.data.studentId;
      }
    }
  }
}
```

---

## Seed Plan (`scripts/seed.ts`)

**Hero records:**
- Teacher: Prof. Raghav, class code `BST101`
- Lecture: "Binary Search Trees — Insertion & Deletion" with Cloudinary audio + board photo URLs
- Note: Structured Markdown with BST diagram embedded via Cloudinary URL
- Students: Suresh (accuracy 72%), Priya (88%), Rahul (45%)
- QuizSessions: Suresh's BST quiz (2/3), Priya's (3/3), Rahul's (1/3)
- Performance: Suresh strong on insertion (85%), weak on deletion (40%)

**Volume:** 3 lectures, 3 notes, 3 students, 5 quiz sessions, 8 performance records

**Idempotent:** Script deletes all docs for class `BST101` then re-seeds. Re-run = same demo state.

---

## Change Ritual

Schema change = contract change: bump version here → DECISIONS entry → re-seed → ping all consumers (FE + Quiz+Analytics tracks).
**Freeze schema at day 5 (T-24h from submission).** Defend it after. No new collection paths after that.
