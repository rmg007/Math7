"""
claude_batch_tagger.py — Parallel Claude API file tagger
Processes multiple spec files concurrently using ThreadPoolExecutor.
Usage: python scripts/claude_batch_tagger.py --from-file filelist.json
       python scripts/claude_batch_tagger.py file1.ts file2.ts ...
"""
import sys
import os
import json
import time
import anthropic
from concurrent.futures import ThreadPoolExecutor, as_completed

# Force UTF-8 output on Windows
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Load API key
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    secrets_path = os.path.join(os.path.dirname(__file__), "..", ".secrets")
    if os.path.exists(secrets_path):
        with open(secrets_path, encoding="utf-8") as f:
            for line in f:
                if line.startswith("ANTHROPIC_API_KEY="):
                    ANTHROPIC_API_KEY = line.strip().split("=", 1)[1]
                    break

if not ANTHROPIC_API_KEY:
    print("ERROR: ANTHROPIC_API_KEY not found", file=sys.stderr)
    sys.exit(1)

SYSTEM_PROMPT = """You are a precise code editor for Playwright TypeScript test files.

TAGGING RULES — append ONE tag to the END of each test() title string:
- @smoke   -> critical user paths: login, navigation, page load, key CRUD flows (must pass on every PR)
- @logic   -> business logic validation: form validation, error messages, data integrity, edge cases
- @responsive -> layout/viewport-sensitive tests: mobile views, tablet views, element sizing

STRICT CONSTRAINTS:
1. ONLY modify strings inside test('...') or test("...") title arguments
2. NEVER modify test.describe() blocks
3. NEVER change test logic, assertions, or selectors
4. Append tag at END of existing title string
5. If title already has correct tag -- leave it unchanged (no duplicate)
6. If title has wrong tag -- replace with correct one
7. test.describe() blocks that already have a tag annotation are fine -- do NOT remove them

Output ONLY the complete modified file -- no explanations, no markdown fences."""


def tag_file(filepath: str, retries: int = 3) -> tuple[str, str, bool]:
    """Returns (filepath, status_message, was_modified)"""
    if not os.path.exists(filepath):
        return filepath, "SKIP - file not found", False

    with open(filepath, "r", encoding="utf-8") as f:
        original = f.read()

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    for attempt in range(retries):
        try:
            message = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=8192,
                system=SYSTEM_PROMPT,
                messages=[
                    {
                        "role": "user",
                        "content": (
                            f"Tag each test() title in this file with @smoke, @logic, or @responsive. "
                            f"Output ONLY the complete modified file.\n\n"
                            f"FILE: {filepath}\n\n```typescript\n{original}\n```"
                        ),
                    }
                ],
            )
            break  # success
        except anthropic.RateLimitError:
            if attempt < retries - 1:
                wait = 60 * (attempt + 1)  # 60s, 120s backoff
                print(f"  [RATE LIMIT] {filepath} - waiting {wait}s...")
                time.sleep(wait)
            else:
                raise

    result = message.content[0].text.strip()

    # Strip markdown fences if Claude wrapped the output
    if result.startswith("```"):
        lines = result.split("\n")
        end = len(lines) - 1 if lines[-1].strip() in ("```", "```typescript") else len(lines)
        result = "\n".join(lines[1:end])

    was_modified = result.strip() != original.strip()

    if was_modified:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(result)
        return filepath, "MODIFIED", True

    return filepath, "NO CHANGE", False


def main():
    args = sys.argv[1:]
    files = []

    if "--from-file" in args:
        idx = args.index("--from-file")
        list_file = args[idx + 1]
        with open(list_file, encoding="utf-8") as f:
            files = json.load(f)
    else:
        files = [a for a in args if not a.startswith("--")]

    if not files:
        print("Usage: python scripts/claude_batch_tagger.py --from-file filelist.json")
        print("       python scripts/claude_batch_tagger.py file1.ts file2.ts ...")
        sys.exit(1)

    max_workers = 2  # Conservative to avoid rate limits
    print(f"[BATCH] Processing {len(files)} files with {max_workers} parallel workers...")

    modified = 0
    no_change = 0
    errors = 0

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(tag_file, f): f for f in files}
        for future in as_completed(futures):
            filepath = futures[future]
            try:
                _, status, changed = future.result()
                short = filepath.replace("admin-panel/tests/", "")
                if changed:
                    modified += 1
                    print(f"  [MODIFIED]   {short}")
                else:
                    no_change += 1
                    print(f"  [NO CHANGE]  {short}")
            except Exception as e:
                errors += 1
                print(f"  [ERROR]      {filepath}: {e}", file=sys.stderr)

    print(f"\n[DONE] Modified: {modified} | Unchanged: {no_change} | Errors: {errors}")


if __name__ == "__main__":
    main()
