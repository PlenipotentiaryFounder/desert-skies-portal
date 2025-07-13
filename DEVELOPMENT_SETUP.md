# Development Setup Guide

## MCP Configuration Setup

To avoid committing sensitive data and having push protection issues:

### 1. Copy the MCP Template
```bash
cp .cursor/mcp.json.example .cursor/mcp.json
```

### 2. Set Environment Variables
Add to your system environment or `.env.local`:
```bash
GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here
```

### 3. Never Commit Actual Tokens
- The `.cursor/mcp.json` file is gitignored
- Use the template file as reference
- Always use environment variables for sensitive data

## Git Workflow Best Practices

### 1. Always Work on Main Branch
```bash
git checkout main
git pull origin main
# make changes
git add .
git commit -m "your message"
git push origin main
```

### 2. Before Committing, Check for Secrets
```bash
git diff --cached | grep -E "(token|key|password|secret)"
```

### 3. If You Accidentally Commit Secrets
```bash
# DON'T PANIC - follow these steps:
git reset HEAD~1  # undo last commit
# remove the secret from files
git add .
git commit -m "fix: remove sensitive data"
git push origin main
```

## Emergency Secret Removal
If secrets make it to remote:
1. Remove from files and add to .gitignore
2. Use git filter-branch (as we did) or BFG Repo-Cleaner
3. Force push (only if you're sure no one else is working on the branch)

## Package Manager
This project uses **pnpm** - always use:
- `pnpm install`
- `pnpm run dev`
- `pnpm run build`

## Supabase Setup
Use MCP tools instead of direct Supabase client for consistency with the project architecture. 