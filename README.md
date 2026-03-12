# AI Sales Trainer - Project Summary

**Last Updated:** February 26, 2026

## Project Overview

An AI-powered sales training application for Sleep Number sales professionals to practice their "Connect & Discover" skills through realistic customer interactions.

---

## Key Features

### User Features (Sales Professionals)
- **SSO Login** - SAML authentication with Sleep Number credentials
- **Home Page** - Welcome message, user stats, last 10 sessions
- **Persona Selection** - Choose DISC + Marketing persona (or Random)
- **Training Session** - Voice-based interaction with AI avatar (15 min max)
- **Self-Evaluation** - Reflection questions after each session
- **Results & Feedback** - AI-generated qualitative feedback, strengths, areas to improve, replay option

### Admin Features
- **Analytics Dashboard** - Real-time metrics, usage stats, persona distribution, performance trends

---

## Personas

### DISC Personality Types
| Persona | Description |
|---------|-------------|
| Director | Decisive, direct, results-oriented |
| Realter | Supportive, patient, team-focused |
| Socializer | Enthusiastic, optimistic, social |
| Thinker | Analytical, precise, detail-oriented |
| Random | System randomly assigns |

### Marketing Sub-Personas
| Persona | Description |
|---------|-------------|
| Skeptical | Needs proof and evidence |
| Budget Conscious | Value-focused buyer |
| Luxury Seeker | Premium experience seeker |
| Random | System randomly assigns |

---

## Session Flow

1. **Login** → SSO with Sleep Number credentials
2. **Home Page** → View stats, start new session, or review past sessions
3. **Persona Selection** → Pick DISC + Marketing persona
4. **Training Session** → Voice interaction with AI avatar (max 15 min)
   - Session ends when user says "Let's get your SleepNumber setting" (or variation)
   - Or when 15-minute timer expires
5. **Self-Evaluation** → Answer reflection questions
   - If Random: "What DISC persona did you interact with?"
   - "What was the toughest part?"
   - "What could you have done better?"
6. **Results** → View AI feedback, strengths, improvements, replay session
7. **Return Home** → Start another session or logout

---

## System Prompts Needed

### 1. AI Persona Behavior Prompt
Defines how the AI customer behaves based on DISC + Marketing persona combination:
- Personality traits
- Objection styles
- Response patterns
- Customer scenario context

### 2. Session Evaluation Prompt
Defines how AI evaluates the completed session:
- Connect & Discover criteria
- How to identify strengths
- How to suggest improvements
- Qualitative feedback format

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Web Application |
| Backend | API Services |
| AI Engine | Claude (Azure AI Foundry) |
| Avatar | Avatar Engine (with integrated voice) |
| Database | Azure Cosmos DB / SQL |
| Storage | Azure Blob Storage |
| Auth | SAML SSO |
| Hosting | Azure App Service |
| Monitoring | Azure Monitor |

---

## Project Files

| File | Description | How to Open |
|------|-------------|-------------|
| `fishbone-diagram.html` | Original architecture fishbone | `open fishbone-diagram.html` |
| `user-interaction-fishbone.html` | User flow fishbone with Analytics & Prompts | `open user-interaction-fishbone.html` |
| `architecture-overview.html` | Layered system architecture diagram | `open architecture-overview.html` |
| `LOE-Estimation-Worksheet.csv` | Level of Effort estimation (48 items) | `open LOE-Estimation-Worksheet.csv` |
| `demo-app/index.html` | Interactive clickable prototype | `open demo-app/index.html` |

### Open All Files
```bash
cd /Users/siva.konjerla/sleep-number-trainer/
open fishbone-diagram.html user-interaction-fishbone.html architecture-overview.html LOE-Estimation-Worksheet.csv demo-app/index.html
```

---

## LOE Categories

The Level of Effort worksheet includes these categories:

1. **SSO & Authentication** (2 items)
2. **Home Page** (4 items)
3. **Persona Selection** (4 items)
4. **Training Session** (10 items)
5. **Session History** (3 items)
6. **Self-Evaluation** (4 items)
7. **Results & Feedback** (6 items)
8. **System Prompts** (3 items)
9. **Infrastructure** (6 items)
10. **Analytics - Admin** (13 items)

**Estimation columns:** Frontend, Backend, AI Integration & Avatars, Prompt Engineering, DevOps

---

## Analytics Metrics (Admin Dashboard)

### Usage Metrics
- Total Users / Active Users
- Total Sessions / Completed Sessions
- Completion Rate %
- Average Session Duration

### Persona Analytics
- Sessions by DISC Type
- Sessions by Marketing Persona
- Persona Combination Heatmap

### Performance Trends
- Self-Evaluation Submission Rate
- User Improvement Over Time

---

## Next Steps

- [ ] Get LOE estimates from development team
- [ ] Finalize Connect & Discover evaluation criteria
- [ ] Create AI Persona Behavior Prompts
- [ ] Create Session Evaluation Prompt
- [ ] Select Avatar Engine technology
- [ ] Confirm SSO/SAML configuration with IT
- [ ] Define data retention policy for analytics

---

## Resume Work in Claude Code

Start a new session and say:

> "I'm working on the AI Sales Trainer project. The files are in `/Users/siva.konjerla/sleep-number-trainer/`. Read the README.md and let's continue."

---

## Contact

Project Owner: Siva Konjerla
