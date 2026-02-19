import os
import json
import asyncio
from pathlib import Path
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# ==============================================================================
# CONFIGURATION
# ==============================================================================
BOT_TOKEN = "8086665437:AAGgDWGSOGcNlV9c9xsJMID0C-3W6K6DrN4"
AUTHORIZED_USER_ID = 7013244621

PROJECT_ROOT = Path(__file__).parent.resolve()
TASKS_FILE = PROJECT_ROOT / "tasks.json"
TASKS_STATUS_FILE = PROJECT_ROOT / "tasks.status.json"
# ==============================================================================

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    print(f"Incoming /start from User: {user.first_name} (ID: {user.id})")
    if AUTHORIZED_USER_ID is None:
        await update.message.reply_text(
            f"Bot not configured. Your ID is: {user.id}\n"
            f"Set AUTHORIZED_USER_ID in antigravity_bridge.py"
        )
        return
    if user.id != AUTHORIZED_USER_ID:
        await update.message.reply_text("Unauthorized user.")
        return
    await update.message.reply_text(
        "Antigravity Bridge Active.\n"
        "Send a message to queue a task.\n"
        "/status - Check last task\n"
        "/queue - Show queue"
    )

async def check_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if user.id != AUTHORIZED_USER_ID:
        return
    if not TASKS_STATUS_FILE.exists():
        await update.message.reply_text("No task results found yet.")
        return
    try:
        with open(TASKS_STATUS_FILE, "r", encoding="utf-8") as f:
            status_data = json.load(f)
        if not status_data:
            await update.message.reply_text("Status file is empty.")
            return
        last = status_data[-1] if isinstance(status_data, list) else status_data
        exit_code = last.get("exit_code", "?")
        desc = last.get("description", "Unknown task")
        duration = last.get("duration_seconds", "?")
        stdout = last.get("stdout", "")[:500]
        icon = "OK" if exit_code == 0 else "FAIL"
        await update.message.reply_text(
            f"{icon} Last Task:\n{desc}\nExit: {exit_code}\nDuration: {duration}s\nOutput:\n{stdout or '(none)'}"
        )
    except Exception as e:
        await update.message.reply_text(f"Error reading status: {e}")

async def show_queue(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if user.id != AUTHORIZED_USER_ID:
        return
    if not TASKS_FILE.exists():
        await update.message.reply_text("No tasks in queue.")
        return
    try:
        with open(TASKS_FILE, "r", encoding="utf-8") as f:
            tasks = json.load(f)
        if not tasks:
            await update.message.reply_text("Task queue is empty.")
            return
        lines = []
        for i, task in enumerate(tasks, 1):
            desc = task.get("description", "Unknown")
            cmd = task.get("command", "?")
            lines.append(f"{i}. {desc}\n   {cmd}")
        await update.message.reply_text(f"Task Queue ({len(tasks)}):\n\n" + "\n\n".join(lines))
    except Exception as e:
        await update.message.reply_text(f"Error reading queue: {e}")

async def route_to_antigravity(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if AUTHORIZED_USER_ID is None:
        await update.message.reply_text(f"Configure AUTHORIZED_USER_ID first. Your ID is: {user.id}")
        return
    if user.id != AUTHORIZED_USER_ID:
        print(f"Blocked unauthorized message from ID: {user.id}")
        return
    user_prompt = update.message.text
    if not user_prompt:
        return
    status_message = await update.message.reply_text("Queuing task...")
    try:
        task = {
            "description": f"[Telegram] {user_prompt[:80]}",
            "command": user_prompt,
            "cwd": str(PROJECT_ROOT),
            "source": "telegram_bridge",
            "metadata": {"user_id": user.id, "username": user.username}
        }
        existing_tasks = []
        if TASKS_FILE.exists():
            try:
                with open(TASKS_FILE, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content:
                        existing_tasks = json.loads(content)
                        if not isinstance(existing_tasks, list):
                            existing_tasks = [existing_tasks]
            except (json.JSONDecodeError, Exception):
                existing_tasks = []
        existing_tasks.append(task)
        with open(TASKS_FILE, "w", encoding="utf-8") as f:
            json.dump(existing_tasks, f, indent=2, ensure_ascii=False)
        await status_message.edit_text(
            f"Task Queued!\nCommand: {user_prompt[:100]}\n"
            f"ops_runner will pick this up. Use /status to check."
        )
        print(f"Task queued: {user_prompt[:80]}")
    except Exception as e:
        await status_message.edit_text(f"Bridge Error: {type(e).__name__}: {str(e)}")

def main():
    if not BOT_TOKEN or "YOUR_BOT_TOKEN" in BOT_TOKEN:
        print("Error: BOT_TOKEN is not set correctly")
        return
    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("status", check_status))
    application.add_handler(CommandHandler("queue", show_queue))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, route_to_antigravity))
    print("Antigravity Telegram Bridge is running!")
    print(f"Project Root: {PROJECT_ROOT}")
    print(f"Tasks File: {TASKS_FILE}")
    if AUTHORIZED_USER_ID is None:
        print("NOTE: AUTHORIZED_USER_ID is not set. Send /start to see your ID.")
    else:
        print(f"Locked to User ID: {AUTHORIZED_USER_ID}")
    print("Press Ctrl+C to stop.")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
