# Contract: Quiz Engine                     version: 2

> OWNER: Quiz+Analytics track · CONSUMERS: FE track (Nova), AI-Pipeline track (Sage)
> v2 CHANGE: All quiz state now lives in Firestore (not local SQLite only).
> Teacher dashboard uses onSnapshot for live updates.
> Cross-device quiz history: students can take quizzes on any device.
> Change ritual: edit → bump version + changelog → DECISIONS entry → ping consumers → THEN code.

## Module Interface

The quiz engine manages Firestore-backed quiz sessions.
FSRS scheduling runs locally (ts-fsrs), state synced to Firestore.
Teacher's analytics dashboard updates in real-time via onSnapshot.

---

### `startQuizSession(input: StartQuizInput): Promise<QuizSession>`

Creates a new quiz session in Firestore for a student on a specific note.

**Input — `StartQuizInput`:**
```typescript
{
  studentId: string;
  studentName: string;
  noteId: string;
  classCode: string;
  preferredDifficulty?: 'easy' | 'medium' | 'hard';
}
```

**Output — `QuizSession`:**
```typescript
{
  id: string;
  studentId: string;
  noteId: string;
  classCode: string;
  difficulty: 'easy' | 'medium' | 'hard';
  currentQuestion: QuizQuestion;
  totalQuestions: number;
  questionsRemaining: number;
  streak: number;
  status: 'in_progress';
}
```

**Example:**
```json
{
  "id": "qs-suresh-bst-001",
  "studentId": "anon-uid-suresh",
  "noteId": "note-bst-001",
  "classCode": "BST101",
  "difficulty": "easy",
  "currentQuestion": {
    "id": "q1", "text": "Where are smaller values stored in a BST?",
    "type": "mcq", "options": ["Left", "Right", "Root", "Any leaf"],
    "correctIndex": 0, "topic": "BST insertion", "difficulty": "easy"
  },
  "totalQuestions": 3,
  "questionsRemaining": 3,
  "streak": 0,
  "status": "in_progress"
}
```

**Errors:**
```typescript
{ code: "STUDENT_NOT_FOUND", message: "No student with id: {studentId}" }
{ code: "NOTE_NOT_FOUND", message: "No note with id: {noteId}" }
{ code: "NO_QUESTIONS", message: "No quiz questions available for this note" }
{ code: "FIRESTORE_WRITE_FAILED", message: "Session creation failed: {error}" }
```

**Notes:**
- Starting difficulty: determined from student's `performance` records in Firestore for this note's topics.
  - No history → `easy` (confidence builder)
  - avg accuracy < 0.4 → `easy` · 0.4–0.75 → `medium` · > 0.75 → `hard`
- Firestore write creates the session doc. Teacher dashboard's `onSnapshot` fires immediately — teacher sees "Suresh started quiz" in real-time.

---

### `submitAnswer(input: SubmitAnswerInput): Promise<AnswerResult>`

Processes an answer, applies flow-state difficulty adjustment, updates Firestore.
Teacher's live dashboard updates the moment this function is called.

**Input — `SubmitAnswerInput`:**
```typescript
{
  sessionId: string;
  classCode: string;
  questionId: string;
  selectedIndex: number;    // 0-based
}
```

**Output — `AnswerResult`:**
```typescript
{
  correct: boolean;
  correctIndex: number;
  explanation?: string;
  streak: number;
  streakBroken: boolean;
  difficultyAdjusted: boolean;
  nextDifficulty: 'easy' | 'medium' | 'hard';
  nextQuestion: QuizQuestion | null;
  sessionComplete: boolean;
  score?: number;            // present when sessionComplete = true
  performanceUpdate?: TopicPerformance;
}
```

**Example (correct answer, streak continues, difficulty ramps up):**
```json
{
  "correct": true, "correctIndex": 0,
  "streak": 2, "streakBroken": false,
  "difficultyAdjusted": true, "nextDifficulty": "medium",
  "nextQuestion": { "id": "q2", "text": "Worst case for BST insert?", "type": "mcq",
    "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"], "correctIndex": 2,
    "topic": "BST time complexity", "difficulty": "medium" },
  "sessionComplete": false
}
```

**Example (wrong, streak broken, drops difficulty):**
```json
{
  "correct": false, "correctIndex": 2,
  "explanation": "Skewed BST degenerates to a linked list → O(n) worst case.",
  "streak": 0, "streakBroken": true,
  "difficultyAdjusted": true, "nextDifficulty": "easy",
  "nextQuestion": { "id": "q3", "text": "Which BST traversal gives sorted output?", "type": "mcq",
    "options": ["Preorder", "Postorder", "Inorder", "Level-order"], "correctIndex": 2,
    "topic": "inorder traversal", "difficulty": "easy" },
  "sessionComplete": false
}
```

**Errors:**
```typescript
{ code: "SESSION_NOT_FOUND", message: "No active session: {sessionId}" }
{ code: "SESSION_COMPLETE", message: "This quiz session is already completed" }
{ code: "INVALID_QUESTION", message: "Question {questionId} not found in session" }
{ code: "FIRESTORE_WRITE_FAILED", message: "Answer write failed: {error}" }
```

**Side effects on Firestore:**
1. `quizSessions/{sessionId}.answers` — appended with new StudentAnswer
2. `performance/{studentId}_{topic}` — updated accuracy + trend (Firestore transaction)
3. `students/{studentId}.overallAccuracy` — recalculated
4. Teacher's `onSnapshot` on `quizSessions` fires → live dashboard bar chart updates

---

### Flow-State Difficulty Ramping Rules (unchanged from v1)

```
START → calibrated to student's FSRS history for this topic (or 'easy' for first-timers)

CORRECT (streak building):
  streak = 1 → stay at current difficulty
  streak = 2 → ramp UP one tier (easy→medium, medium→hard)
  streak ≥ 3 → stay at hard + trigger "🔥 On Fire!" animation

WRONG (streak broken):
  → drop DOWN one tier (hard→medium, medium→easy)
  → easy is floor
  → next question targets the SAME TOPIC (remediation)
```

---

### `subscribeToClassQuizSessions(input: SubscribeInput, callback): Unsubscribe`

NEW in v2. Sets up Firestore `onSnapshot` listener for teacher's live analytics dashboard.

**Input — `SubscribeInput`:**
```typescript
{
  classCode: string;
  noteId: string;          // filter to sessions for this lecture's note
}
```

**Callback receives:** `QuizSessionSummary[]` — lightweight view of all sessions:
```typescript
interface QuizSessionSummary {
  studentId: string;
  studentName: string;
  score: number | null;    // null if in_progress
  status: 'in_progress' | 'completed';
  difficulty: 'easy' | 'medium' | 'hard';
  correctCount: number;
  totalAnswered: number;
  lastActivity: string;   // ISO-8601
}
```

**Output:** `() => void` — unsubscribe function

**Notes:** Fires immediately with cached data, then on every quiz answer submission.
The teacher sees the dashboard update in real-time as each student submits answers.
This is the live "72% got Q2 wrong" moment from PRD Beat 6.

---

### `getStudentPerformance(studentId: string, classCode: string): Promise<StudentDashboard>`

Fetches the student's cross-device performance history from Firestore.

**Output — `StudentDashboard`:**
```typescript
{
  studentId: string;
  name: string;
  overallAccuracy: number;
  totalQuizzes: number;
  streakDays: number;
  topicBreakdown: TopicPerformance[];
  recentSessions: RecentSession[];   // last 5 across ALL lectures (cross-device history!)
  strengths: string[];               // topics accuracy > 0.75
  gaps: string[];                    // topics accuracy < 0.5
  fsrsDueTodayCount: number;         // topics FSRS scheduled for review today
}
```

**Example:**
```json
{
  "studentId": "anon-uid-suresh",
  "name": "Suresh",
  "overallAccuracy": 0.72,
  "totalQuizzes": 14,
  "streakDays": 3,
  "topicBreakdown": [
    { "topic": "BST insertion", "accuracy": 0.85, "totalAttempts": 7, "trend": "improving" },
    { "topic": "BST deletion", "accuracy": 0.40, "totalAttempts": 5, "trend": "stable" }
  ],
  "recentSessions": [
    { "noteTitle": "Binary Search Trees", "score": 0.67, "date": "2026-09-21", "difficulty": "medium", "device": "phone" },
    { "noteTitle": "Graph Traversal", "score": 0.83, "date": "2026-09-20", "difficulty": "hard", "device": "tablet" }
  ],
  "strengths": ["BST insertion", "BST time complexity"],
  "gaps": ["BST deletion"],
  "fsrsDueTodayCount": 2
}
```

---

### `getClassAnalytics(noteId: string, classCode: string): Promise<ClassAnalytics>`

Aggregates all student performance for the teacher's dashboard.
Used to seed the initial view (before `subscribeToClassQuizSessions` takes over with live data).

**Output — `ClassAnalytics`:**
```typescript
{
  noteId: string;
  noteTitle: string;
  totalStudents: number;
  completedCount: number;
  inProgressCount: number;
  averageScore: number;
  topicDifficulty: TopicDifficulty[];
  scoreDistribution: {
    '0-20': number; '21-40': number; '41-60': number; '61-80': number; '81-100': number;
  };
}
```

**Example:**
```json
{
  "noteId": "note-bst-001",
  "noteTitle": "Binary Search Trees",
  "totalStudents": 3,
  "completedCount": 2,
  "inProgressCount": 1,
  "averageScore": 0.63,
  "topicDifficulty": [
    { "topic": "BST insertion", "classAccuracy": 0.80, "flag": "ok" },
    { "topic": "BST deletion", "classAccuracy": 0.35, "flag": "review_needed" }
  ],
  "scoreDistribution": { "0-20": 0, "21-40": 1, "41-60": 0, "61-80": 1, "81-100": 1 }
}
```

---

### `getStudentQuizHistory(studentId: string, classCode: string): Promise<QuizHistoryItem[]>`

NEW in v2. Returns complete cross-device quiz history for a student.
Called from student's "My Progress" screen.

**Output — `QuizHistoryItem[]`:**
```typescript
interface QuizHistoryItem {
  sessionId: string;
  noteId: string;
  noteTitle: string;
  subject: string | null;
  score: number;
  difficulty: 'easy' | 'medium' | 'hard';
  correctCount: number;
  totalQuestions: number;
  completedAt: string;        // ISO-8601
  nextReviewDue: string | null;  // from FSRS scheduling
}
```

**Ordered by:** `completedAt DESC` (latest first)

---

## Types

```typescript
interface TopicPerformance {
  topic: string;
  accuracy: number;        // 0.0–1.0
  totalAttempts: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface TopicDifficulty {
  topic: string;
  classAccuracy: number;
  flag: 'ok' | 'review_needed';   // review_needed if classAccuracy < 0.5
}

interface RecentSession {
  noteTitle: string;
  score: number;
  date: string;            // YYYY-MM-DD
  difficulty: 'easy' | 'medium' | 'hard';
  device?: string;         // optional metadata
}

// QuizQuestion, StudentAnswer — same as ai-pipeline.md
```

## Events

`quiz.answer.submitted` — emitted locally after each Firestore write:
```typescript
{
  sessionId: string;
  studentId: string;
  questionId: string;
  correct: boolean;
  streak: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timestamp: string;
}
```
Consumed by: FE (streak fire animation, confetti, shake on wrong)

`quiz.session.completed` — emitted locally when session finishes:
```typescript
{
  sessionId: string;
  studentId: string;
  noteId: string;
  score: number;
  questionsTotal: number;
  correctCount: number;
  timestamp: string;
}
```
Consumed by: FE (results screen), FSRS scheduler (update next-review schedule)

`quiz.class.snapshot` — Firestore `onSnapshot` update (teacher-side):
```typescript
QuizSessionSummary[]   // full updated list of all session summaries for the note
```
Consumed by: FE teacher analytics screen (live bar chart update)

---

## Changelog

- v2 2026-09-21: Online pivot. All state moved to Firestore. Added subscribeToClassQuizSessions (live teacher dashboard), getStudentQuizHistory (cross-device history), fsrsDueTodayCount in dashboard. FSRS scheduling synced to Firestore.
- v1 2026-09-21: initial — startQuizSession, submitAnswer, getStudentPerformance, getClassAnalytics, flow-state rules (local SQLite only)
