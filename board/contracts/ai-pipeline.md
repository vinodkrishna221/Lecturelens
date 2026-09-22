# Contract: AI Pipeline                    version: 2

> OWNER: AI-Pipeline track (Sage) · CONSUMERS: FE track (Nova), Quiz+Analytics track
> v2 CHANGE: Added Cloudinary upload functions. transcribeAudio, generateStructuredNote,
> generateQuizQuestions, extractBoardText unchanged from v1.
> Change ritual: edit → bump version + changelog → DECISIONS entry → ping consumers → THEN code.

## Module Interface

The AI pipeline is a set of async TypeScript functions callable from React Native.
On-device AI (Whisper NPU, Phi-4-mini, ML Kit OCR) runs first.
Cloudinary upload runs in background after AI processing completes.

---

### `initModels(): Promise<ModelStatus>`

Call once at app startup. FE shows loading screen until resolved.

**Output — `ModelStatus`:**
```typescript
{
  whisper: { loaded: boolean; modelSize: string; error?: string };
  slm: { loaded: boolean; modelName: string; quantization: string; error?: string };
  ocr: { available: boolean };
}
```

---

### `transcribeAudio(audioPath: string): Promise<TranscriptionResult>`

Unchanged from v1. Runs Whisper Small on Snapdragon NPU.

**Input:** `audioPath: string` (local file path, 16kHz mono .wav)

**Output — `TranscriptionResult`:**
```typescript
{
  transcript: string;
  language: string;
  durationMs: number;
  segments: TranscriptSegment[];
}
```

**Example:**
```json
{
  "transcript": "Today we will look at binary search trees...",
  "language": "en",
  "durationMs": 4200,
  "segments": [{ "start": 0.0, "end": 2.1, "text": "Today we will look at binary search trees." }]
}
```

**Errors:**
```typescript
{ code: "MODEL_NOT_LOADED", message: "Whisper model not found" }
{ code: "AUDIO_FILE_MISSING", message: "Audio file not found: {audioPath}" }
{ code: "TRANSCRIPTION_FAILED", message: "Whisper inference failed: {nativeError}" }
```

**Latency budget:** < 15s for 3 minutes of audio on Snapdragon 8 Gen 3.

---

### `extractBoardText(imagePath: string): Promise<OcrResult>`

Unchanged from v1. Runs ML Kit Text Recognition v2 on-device.

**Input:** `imagePath: string` (local .jpg/.png from expo-camera)

**Output — `OcrResult`:**
```typescript
{
  text: string;
  blocks: OcrBlock[];
  confidence: number;    // 0.0–1.0
  processingMs: number;
}
```

**Errors:**
```typescript
{ code: "IMAGE_FILE_MISSING", message: "Image not found: {imagePath}" }
{ code: "OCR_FAILED", message: "ML Kit text recognition failed: {nativeError}" }
```

**Latency budget:** < 2s per image.

---

### `generateStructuredNote(input: NoteGenerationInput): Promise<GeneratedNote>`

Unchanged from v1. Runs Phi-4-mini on-device. Cloudinary URLs injected after upload (see `uploadLectureAssets`).

**Input — `NoteGenerationInput`:**
```typescript
{
  transcript: string;
  boardText: string | null;
  boardImagePath: string | null;   // local path — replaced by Cloudinary URL post-upload
  subject: string | null;
}
```

**Output — `GeneratedNote`:**
```typescript
{
  markdownContent: string;    // may contain local image paths initially; updated post-upload
  summary: string;
  keyTopics: string[];
  processingMs: number;
}
```

**Errors:**
```typescript
{ code: "SLM_NOT_LOADED", message: "Phi-4-mini model not loaded" }
{ code: "GENERATION_FAILED", message: "SLM inference failed: {nativeError}" }
{ code: "GENERATION_TIMEOUT", message: "Note generation exceeded 30s timeout" }
```

**Latency budget:** < 15s for a 3-minute lecture.

---

### `generateQuizQuestions(input: QuizGenerationInput): Promise<QuizQuestion[]>`

Unchanged from v1. Reuses Phi-4-mini with a different prompt.

**Input — `QuizGenerationInput`:**
```typescript
{
  noteContent: string;
  keyTopics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
  excludeTopics?: string[];
}
```

**Output:** `QuizQuestion[]` — see Types section.

**Errors:**
```typescript
{ code: "SLM_NOT_LOADED", message: "Phi-4-mini model not loaded" }
{ code: "GENERATION_FAILED", message: "Quiz generation failed: {nativeError}" }
```

**Latency budget:** < 10s for 3 questions.

---

### `uploadLectureAssets(input: UploadInput): Promise<UploadResult>`  ← NEW in v2

Uploads audio, board photo, and generated diagrams to Cloudinary.
Called after on-device AI completes. Runs in background with progress events.

**Input — `UploadInput`:**
```typescript
{
  lectureId: string;
  classCode: string;
  audioPath: string;           // local file path to .wav recording
  boardPhotoPath: string | null;  // local file path to board .jpg (nullable)
  diagramPaths: string[];      // local paths to extracted diagram images
  uploadPreset: string;        // Cloudinary unsigned upload preset name
}
```

**Output — `UploadResult`:**
```typescript
{
  audioUrl: string;            // Cloudinary CDN URL for audio playback
  boardPhotoUrl: string | null;
  diagramUrls: string[];
  pdfNoteUrl: string | null;   // auto-generated PDF if Cloudinary transform succeeds
  totalUploadMs: number;
}
```

**Example:**
```json
{
  "audioUrl": "https://res.cloudinary.com/lecturelens/video/upload/v1/lectures/bst-audio.wav",
  "boardPhotoUrl": "https://res.cloudinary.com/lecturelens/image/upload/v1/boards/bst-board.jpg",
  "diagramUrls": ["https://res.cloudinary.com/lecturelens/image/upload/v1/diagrams/bst-diagram-1.jpg"],
  "pdfNoteUrl": "https://res.cloudinary.com/lecturelens/image/upload/fl_attachment/v1/notes/bst-note.pdf",
  "totalUploadMs": 8500
}
```

**Errors:**
```typescript
{ code: "UPLOAD_FAILED", message: "Cloudinary upload failed: {cloudinaryError}" }
{ code: "FILE_NOT_FOUND", message: "Local file not found: {path}" }
{ code: "NETWORK_ERROR", message: "Upload requires internet connection" }
```

**Notes:** Progress events emitted via `ai.upload.progress`. FE shows upload progress bar. Firestore Lecture doc updated with URLs as they complete (partial updates OK — audio first, then photos).

---

## Types

```typescript
interface TranscriptSegment {
  start: number;       // seconds from audio start
  end: number;
  text: string;
}

interface OcrBlock {
  text: string;
  bounds: { x: number; y: number; width: number; height: number };
}

// QuizQuestion — defined in quiz-engine.md contract
// QuizGenerationInput.difficulty, QuizDifficulty — same enum across all contracts
```

## Events

`ai.pipeline.status` — during on-device processing:
```typescript
{
  stage: 'transcribing' | 'ocr' | 'structuring' | 'quiz_generating';
  progress: number;            // 0.0–1.0
  estimatedRemainingMs: number;
}
```

`ai.upload.progress` — during Cloudinary upload:  ← NEW in v2
```typescript
{
  lectureId: string;
  assetType: 'audio' | 'boardPhoto' | 'diagram' | 'pdf';
  progress: number;      // 0.0–1.0 for this asset
  url?: string;          // set when asset upload completes
}
```

Both emitted when: respective stage starts/progresses. Consumed by: FE (progress UI).

---

## Changelog

- v2 2026-09-21: Added `uploadLectureAssets`, `ai.upload.progress` event. Online pivot — Cloudinary storage integration.
- v1 2026-09-21: initial — transcribeAudio, extractBoardText, generateStructuredNote, generateQuizQuestions, initModels
