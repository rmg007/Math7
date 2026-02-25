import subprocess, os

os.chdir(r"C:\Users\mhali\OneDrive\Desktop\Important Projects\Questerix")

# Check git status
result = subprocess.run(["git", "status", "--short"], capture_output=True, text=True)
with open("_git_report.txt", "w", encoding="utf-8") as f:
    f.write("=== GIT STATUS ===\n")
    f.write(result.stdout or "(empty - working tree clean)\n")
    f.write(result.stderr or "")
    f.write("\n=== GIT LOG (last 5) ===\n")
    log = subprocess.run(["git", "log", "-n", "5", "--oneline"], capture_output=True, text=True)
    f.write(log.stdout or "(no output)\n")
    f.write("\n=== DONE ===\n")

print("Report written to _git_report.txt")
