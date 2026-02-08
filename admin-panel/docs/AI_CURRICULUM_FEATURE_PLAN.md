# AI Curriculum Assistant - Feature Implementation Plan

## 1. Executive Summary

This feature transforms the `admin-panel` from a manual data entry tool into an **AI-driven Content Factory**. By leveraging **Gemini 1.5 Flash** and client-side document processing, admins can generate hundreds of curriculum-aligned questions in minutes from existing textbooks or lesson plans.

The implementation prioritizes **Minimal Cost** by:
1.  **Client-Side Processing:** Parsing PDFs and Word docs in the browser (0 server cost).
2.  **Prompt Optimization:** Using a "Review Prompt" step to ensure the AI gets it right the first time (fewer retries).
3.  **Manual QA:** Utilizing Excel/CSV for bulk review instead of building complex editing UIs.

---

## 2. Technical Architecture

### Core Libraries
| Library | Purpose | Reason |
| :--- | :--- | :--- |
| **`react-dropzone`** | File Upload UI | Drag & drop, file type validation, multi-file support. |
| **`pdfjs-dist`** | PDF Parsing | Robust, industry-standard text extraction. |
| **`mammoth`** | .docx Parsing | converting Word documents to clean text. |
| **`papaparse`** | CSV Generation | Reliable JSON-to-CSV conversion handling edge cases. |
| **`zod`** | Schema Validation | Preventing AI "hallucinations" (e.g., ensuring "points" is a number). |
| **`@google/generative-ai`** | AI Engine | Access to Gemini Flash (Fastest/Cheapest model). |

### Data Flow
1.  **Input:** Admin uploads `Lesson3_Geometry.pdf`.
2.  **Processing (Browser):** `pdfjs-dist` extracts raw text layer.
3.  **Configuration:** Admin selects "50 Questions", "Hard Difficulty", and Target Skill (required).
4.  **Prompt Construction:** System merges [System Instructions] + [User Config - Content/Type/Points] + [Extracted Text].
5.  **Review (Human-in-the-Loop):** Admin sees the constructed prompt and adds specific instructions.
6.  **AI Execution:** Request sent to Gemini Flash -> JSON Response.
7.  **Validation:** `zod` ensures response matches `ImportSchema` compatible with `public.questions` table.
8.  **Output:** Browser generates `Lesson3_Questions.csv` with standard columns.
9.  **Deployment:** Admin reviews in Excel -> Uploads via Bulk Import (Manual).

---

## 3. Database Schema Alignment

The AI output must match the `public.questions` table structure:
*   `type`: `question_type` enum (`multiple_choice`, `true_false` -> mapped to `boolean`, etc.)
*   `options`: `jsonb` (Array of objects or strings, e.g. `[{"text": "A", "isCorrect": true}, ...]`)
*   `solution`: `jsonb` (The correct answer structure)
*   `explanation`: `text` (The rationale)
*   `points`: `integer`

**CSV Mapping Strategy:**
To support the existing Bulk Import feature, the CSV will flatten the JSONB columns:
*   `content` -> `content`
*   `type` -> `type`
*   `points` -> `points`
*   `explanation` -> `explanation`
*   `options` -> AI outputs a JSON string or pipe-separated values which admin reviews. The bulk importer parses this string into the `jsonb` column.
*   `skill_title` -> Used to map to `skill_id`.

---

## 4. User Experience (UX) Workflow

### Screen 1: The Generator Dashboard
*   **Location:** `/curriculum/ai-generator` (New Route).
*   **Components:**
    *   **File Drop Area:** "Drag your PDF, Word, or Text file here."
    *   **Configuration Panel:**
        *   **Target Skill:** [Dropdown of all Skills in System] (This resolves the mapping gap).
        *   **Difficulty:** [Easy / Medium / Hard] (Purely prompt instruction, doesn't map to DB column directly unless added).
        *   **Count:** [Input Number] (e.g., 50).
        *   **Question Type:** [Multiple Choice / True-False / All].

### Screen 2: Prompt Review (The "Strategic" Step)
*   **Trigger:** After file upload & config.
*   **Display:** A large text area pre-filled with the generated instruction.
    *   *Example:* "Analyze the uploaded text about 'Quadratic Equations'. Generate 50 questions suitable for Hard difficulty..."
*   **Action:** Admin edits this text.
*   **Button:** "Generate Questions" (this locks the prompt).

### Screen 3: Results & Download
*   **Display:** Success message ("Generated 50 questions successfully").
*   **Preview:** A small table showing the first 5 rows (to verify format).
*   **Action:** "Download CSV".

---

## 5. Prompt Engineering Strategy

To guarantee success, we split the prompt into **System** (Locked) and **User** (Editable) contexts.

### A. System Context (Hidden/Locked)
> "You are a rigid Data Extraction Engine. You DO NOT speak. You ONLY output a JSON Array.
> Your Output Schema must match this Zod definition:
> - `content`: String (The question stem)
> - `type`: String (Enum: 'multiple_choice', 'boolean', 'text_input')
> - `points`: Number (Default: 1)
> - `options`: Array of Objects { text: string } (for MCQs)
> - `correct_answer`: String (The value must match one of the options exactly)
> - `explanation`: String (Short rationale)"

### B. User Context (Editable)
> "Context Material: [INSERT EXTRACTED PDF TEXT HERE]
> Task: Generate [COUNT] [DIFFICULTY] questions based on the Context Material.
> [Admin's Custom Instructions Here]"

---

## 6. Technical Implementation Steps

### Phase 1: Dependencies & Setup
Run the following checks and installs:
```bash
npm install react-dropzone pdfjs-dist mammoth papaparse @google/generative-ai
npm install -D @types/react-dropzone @types/papaparse @types/mammoth
```

### Phase 2: File Parsing Utilities
Create `src/lib/file-parsers.ts` handling `pdfjs-dist` (with worker setup) and `mammoth`.

### Phase 3: The AI Hook & Service
Create `src/hooks/use-ai-generator.ts` and `src/lib/gemini.ts`.
This service calls Gemini Flash using `VITE_GEMINI_API_KEY`.

### Phase 4: Zod Schema Definition
Define `src/lib/schemas/ai-response.ts` matching the `public.questions` table requirements.

### Phase 5: UI Implementation
Create `src/features/curriculum/pages/ai-generator-page.tsx`.
Create `src/features/curriculum/components/ai-question-generator.tsx`.

### Phase 6: CSV Export Logic
Update `src/lib/data-utils.ts` to handle the specific format needed for questions (handling JSON `options` inside a CSV cell).

---

## 7. Risk & Mitigation

| Risk | Mitigation |
| :--- | :--- |
| **AI Hallucination** | Human-in-the-loop review at both Prompt and Excel stages. |
| **Mapping Errors** | Admin MUST select a "Target Skill" from the dropdown in the UI, ensuring `skill_id` is handled post-generation (or `skill_title` is accurate for bulk lookup). |
| **Browser Memory** | `pdfjs-dist` can be heavy. Process one file at a time and clear buffers immediately. |
| **Excel Encoding** | Ensure CSV export uses UTF-8 with BOM (`\uFEFF`) so math symbols display correctly. |

