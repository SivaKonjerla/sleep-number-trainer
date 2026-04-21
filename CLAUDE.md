# AI Sales Trainer - Claude Instructions

## Project Overview
This is an AI-powered sales training app for Sleep Number. It uses Next.js with Tailwind CSS.

## Dual Repo Sync

This repo syncs with a SleepNumber organization repo that uses React + Azure Functions.

**When the user says "push to SleepNumber", "sync to SleepNumber", or similar:**
1. Read `SYNC-TO-SLEEPNUMBER.md` for detailed instructions
2. Run: `~/bin/sync-repos --from personal --to sleepnumber --force`
3. If UI pages were changed, manually translate following the rules in that file
4. Commit and push to the SleepNumber repo

## Key Paths

| This Repo | SleepNumber Repo |
|-----------|------------------|
| `/Users/siva.konjerla/sleep-number-trainer` | `/Users/siva.konjerla/projects/ai-sales-trainer-frontend` |

## Tech Stack
- Next.js 16
- React 18
- TypeScript
- Tailwind CSS
- Azure AI Foundry (Claude API)

## Important Files
- `lib/personas.ts` - Customer persona definitions (synced)
- `lib/systemPrompt.ts` - AI prompt generator (synced)
- `app/page.tsx` - Main trainer page (manual sync)
- `app/realtime/page.tsx` - Realtime voice trainer (manual sync)
- `demo-app/` - Static HTML prototypes (not synced, personal repo only)
