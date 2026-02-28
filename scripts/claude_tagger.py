"""
claude_tagger.py — Supervised Claude API file tagger
Usage: python scripts/claude_tagger.py <file1> [file2 ...] --tag @logic|@smoke|@responsive

Reads each file, asks Claude to add the correct @tag to each test() title,
then writes the result back. No TTY required. Supervised by the main agent.
"""
import sys
import os
import anthropic

# Force UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    # Try to load from .secrets
    secrets_path = os.path.join(os.path.dirname(__file__), '..', '.secrets')
    if os.path.exists(secrets_path):
        with open(secrets_path, encoding='utf-8') as f:
            for line in f:
                if line.startswith("ANTHROPIC_API_KEY="):
                    ANTHROPIC_API_KEY = line.strip().split("=", 1)[1]
                    break

if not ANTHROPIC_API_KEY:
    print("ERROR: ANTHROPIC_API_KEY not found in environment or .secrets", file=sys.stderr)
    sys.exit(1)

SYSTEM_PROMPT = """You are a precise code editor. You will be given a Playwright TypeScript test file.

Your ONLY job is to add test tags to individual test() title strings based on these rules:

TAGGING RULES:
- @logic  → tests that validate form validation, business logic, data integrity, error messages
- @smoke  → tests that validate critical user paths: login, navigation, page load, CRUD operations
- @responsive → tests that validate layout, viewport behaviour, mobile/tablet views

STRICT CONSTRAINTS:
1. ONLY modify the string inside test('...') or test("...") title arguments
2. NEVER modify test.describe() blocks — leave those completely unchanged
3. NEVER modify any test logic, assertions, selectors, or comments
4. Append the tag at the END of the title string (e.g., 'should do X @logic')
5. If a test title already has a correct tag, do NOT add a duplicate
6. If a test title has the WRONG tag, REPLACE it with the correct one
7. Output ONLY the complete modified file content — no explanations, no markdown fences

Apply tags based on the test's actual behaviour, not its filename."""

def tag_file(filepath: str) -> tuple[str, bool]:
    """Returns (result_content, was_modified)"""
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=8192,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Tag each test() in this file. Apply @logic, @smoke, or @responsive to each test() title. Output ONLY the complete modified file.\n\nFILE: {filepath}\n\n```typescript\n{original}\n```"
            }
        ]
    )

    result = message.content[0].text.strip()
    
    # Strip markdown fences if Claude wrapped the output
    if result.startswith("```"):
        lines = result.split('\n')
        result = '\n'.join(lines[1:-1] if lines[-1] == '```' else lines[1:])

    was_modified = result != original
    return result, was_modified


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/claude_tagger.py <file1> [file2 ...]")
        sys.exit(1)

    files = sys.argv[1:]
    
    for filepath in files:
        if not os.path.exists(filepath):
            print(f"[SKIP] File not found: {filepath}")
            continue

        print(f"[PROCESSING] {filepath}")
        try:
            result, was_modified = tag_file(filepath)
            if was_modified:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(result)
                print(f"[DONE] MODIFIED: {filepath}")
            else:
                print(f"[DONE] NO CHANGE: {filepath}")
        except Exception as e:
            print(f"[ERROR] FAILED: {filepath}: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
