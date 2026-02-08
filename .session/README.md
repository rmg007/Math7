# Session State Directory

This directory stores session state files for the `/resume` workflow.

## File Format

Session files follow the naming convention: `YYYY-MM-DD-task-slug.md`

## Lifecycle

1. Created when `/blocked` is called or session ends mid-task
2. Read by `/resume` to continue work
3. Archived to `.session/archive/` after task completion

## This directory is git-tracked but files are ephemeral.
