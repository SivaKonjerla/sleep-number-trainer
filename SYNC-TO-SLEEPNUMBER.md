# Sync to SleepNumber Repo

When the user says **"push it to SleepNumber repo as well"** or similar, follow these instructions.

## Repository Paths

| Repo | Path |
|------|------|
| Personal (Next.js) | `/Users/siva.konjerla/sleep-number-trainer` |
| SleepNumber (React) | `/Users/siva.konjerla/projects/ai-sales-trainer-frontend` |

---

## Step 1: Sync Shared Logic Files (Automatic)

Run the sync script for files that are identical in both repos:

```bash
~/bin/sync-repos --from personal --to sleepnumber --force
```

This automatically syncs:
- `lib/personas.ts` → `app/src/lib/personas.ts` AND `api/src/shared/lib/personas.ts`
- `lib/systemPrompt.ts` → `api/src/shared/lib/systemPrompt.ts`
- `public/trainer-icon.svg` → `app/public/trainer-icon.svg`
- `public/trainer-icon-simple.svg` → `app/public/trainer-icon-simple.svg`

---

## Step 2: Manual Sync for UI Pages (If Changed)

If changes were made to **TrainerPage** or **RealtimePage**, manually translate them:

### File Mapping

| Personal Repo | SleepNumber Repo |
|---------------|------------------|
| `app/page.tsx` | `app/src/pages/TrainerPage.tsx` |
| `app/realtime/page.tsx` | `app/src/pages/RealtimePage.tsx` |

### Translation Rules

#### Imports
| Personal (Next.js) | SleepNumber (React) |
|--------------------|---------------------|
| `'use client';` | (remove this line) |
| No React import | Add `import React from 'react';` |
| `@/lib/personas` | `../lib/personas` |
| `@/lib/systemPrompt` | (not needed - backend handles it) |
| No ApiService | Add `import { ApiService } from '../services/ApiService';` |
| No Bootstrap imports | Add `import { Container, Row, Col, Button, Card, Form } from 'react-bootstrap';` |

#### Component Declaration
| Personal | SleepNumber |
|----------|-------------|
| `export default function Home() {` | `const TrainerPage: React.FC = () => {` |
| (end of component) | Add `export default TrainerPage;` at end |

#### API Calls
| Personal | SleepNumber |
|----------|-------------|
| `fetch('/api/chat', { method: 'POST', body: JSON.stringify({ messages, persona }) })` | `ApiService.postChat(messages, persona)` |
| `fetch('/api/realtime-token')` | `ApiService.getRealtimeToken()` |

#### UI Components (Tailwind → React Bootstrap)
| Tailwind CSS | React Bootstrap |
|--------------|-----------------|
| `<button className="bg-blue-500 text-white px-4 py-2 rounded">` | `<Button variant="primary">` |
| `<button className="bg-gray-500 ...">` | `<Button variant="secondary">` |
| `<button className="bg-red-500 ...">` | `<Button variant="danger">` |
| `<button className="bg-green-500 ...">` | `<Button variant="success">` |
| `<div className="flex">` | `<div className="d-flex">` or `<Row>` |
| `<div className="flex-col">` | `<div className="d-flex flex-column">` |
| `<div className="gap-4">` | `<div className="gap-3">` (Bootstrap uses different scale) |
| `<div className="p-4">` | `<div className="p-3">` |
| `<div className="rounded shadow">` | `<Card>` |
| `<div className="grid grid-cols-2">` | `<Row><Col md={6}>...<Col md={6}>` |
| `<input className="border rounded p-2">` | `<Form.Control />` |
| `<select>` | `<Form.Select>` |
| `className="text-xl font-bold"` | `className="h4 fw-bold"` |
| `className="text-gray-500"` | `className="text-muted"` |
| `className="bg-white"` | `className="bg-light"` or `<Card>` |

---

## Step 3: Commit to SleepNumber Repo

After syncing/translating:

```bash
cd /Users/siva.konjerla/projects/ai-sales-trainer-frontend
git status
git add -p  # Review changes
git commit -m "Sync from personal repo: <describe changes>"
git push
```

---

## Quick Sync Commands

```bash
# Sync shared files only (safe, automatic)
~/bin/sync-repos --from personal --to sleepnumber --force

# Preview what would sync
~/bin/sync-repos --from personal --to sleepnumber --dry-run

# Reverse: sync from SleepNumber to personal
~/bin/sync-repos --from sleepnumber --to personal --force
```

---

## What Gets Synced Automatically vs Manually

| File Type | Sync Method |
|-----------|-------------|
| `personas.ts` | Automatic (script) |
| `systemPrompt.ts` | Automatic (script) |
| Icons (SVG) | Automatic (script) |
| `TrainerPage.tsx` / `page.tsx` | Manual (translate UI) |
| `RealtimePage.tsx` | Manual (translate UI) |
| `package.json` | Never sync (different deps) |
| `.env` files | Never sync (secrets) |
| `demo-app/` | Never sync (personal repo only) |
