# NextStep AI 🚀

> **Your AI-Powered Career Co-Pilot** — Bridging the gap between where you are and where you want to be.

![NextStep AI](https://img.shields.io/badge/Status-Active-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![Version](https://img.shields.io/badge/Version-1.1.0-orange) ![Stack](https://img.shields.io/badge/Stack-Vanilla_JS_--_Vite-yellow)

---

## 📋 Overview

NextStep AI is a modular, production-ready career guidance platform designed to help students, freshers, and career switchers navigate their path to success. The platform recently underwent a comprehensive architectural refactoring to deliver **99.9% state consistency**, enhanced **modular logic**, and a premium **Clay-Glass design system**.

---

## ✨ Key Enhancements (v1.1.0)

### 🏗️ Modular Architecture
- **Engine Split**: Large monolithic controllers (like `interview-engine.js`) have been refactored into focused sub-modules (`logic.js`, `timer.js`, `ui.js`) for better testability and maintainability.
- **Service Layering**: Centralized `StorageService` and `WorkflowManager` now handle all persistence and process orchestration, eliminating redundant logic.
- **Data Normalization**: Extracted role-specific data into specialized modules (e.g., `js/data/role-topics.js`) for cleaner engine code.

### 🔄 Workflow Orchestration & Resilience
- **State Machine Integration**: Every major user journey (Onboarding, Analysis, Interview) is now managed by a formal state machine that handles `idle`, `active`, `processing`, and `complete` statuses.
- **Session Recovery**: Automated recovery paths allow users to resume complex AI interviews or resume analyses exactly where they left off, even after a page refresh or crash.

### 🎨 Design System: "Clay-Glass Hybrid"
- **Claymorphism Utility**: Introduced `css/clay-morphism.css` providing soft, tactile components that complement the existing Glassmorphism for a modern, high-end feel.
- **Standardized Tokens**: Unified 8px spacing grid, custom easing functions (`--ease-elastic`), and motion durations defined in `:root`.
- **Premium Micro-Interactions**: Enhanced ripple effects, hover lifts, and transition sequences across all interactive elements.

### 🤖 Reliable AI Intelligence
- **Resilient AI Layer**: Standardized `GeminiService` with auto-retries (429/503), native `AbortController` support, and robust error coordination.
- **Strategic Evaluation**: Comprehensive documentation of LLM alternatives (OpenAI, Anthropic, Groq) provided in `docs/AI_ALTERNATIVES.md`.

---

## 🚀 Core Features

### 📊 Career Readiness Analytics
- **Dynamic Donut Visualization** — Progressive-weighted ring segments for accurate skill tracking.
- **Explainable Scores** — Transparent breakdown of how resume, interview, and roadmap progress contribute to the overall Readiness Score.

### 📄 Smart AI Resume Analysis
- **Multimodal Extraction** — Live Gemini AI analysis of PDF resumes for precise skill, project, and experience extraction.
- **ATS Compatibility** — Real-time scoring and actionable suggestions to optimize resumes for modern screening systems.

### 🎤 Adaptive AI Interviews
- **Hybrid Assessment** — Combines technical coding challenges (via Monaco Editor) with behavioral speech analysis (via Web Speech API).
- **Proctoring Simulator** — Interactive webcam feed and real-time AI evaluation of logic and communication markers.

### 🗺️ Personalized Learning Roadmap
- **Dynamic 6-Week Plan** — Tailored path generated from identified skill gaps with "Refine with AI" natural language customization.
- **Live Resource Sync** — Integrated SerpAPI fetching of YouTube tutorials and LeetCode problems.

---

## 🛠️ Tech Stack

| Category | Technology |
|:---|:---|
| **Frontend** | Vanilla JavaScript (ES2023+), Vite 5.0 |
| **Styling** | Modern CSS3 (Glassmorphism + Claymorphism), GSAP |
| **Intelligence**| Google Gemini AI (1.5 Flash), SerpAPI |
| **Persistence** | Cloud Firestore, LocalStorage (via `StorageService`) |
| **Auth** | Firebase Authentication (Email/Google) |
| **Editor** | Monaco Editor (VS Code core) |

---

## 📁 Project Structure (Modular)

```
NextStep-AI/
├── index.html          # Landing page
├── pages/
│   ├── dashboard.html  # Personalized hub (Aria-enhanced)
│   ├── interview.html  # Adaptive assessment system
│   ├── roadmap.html    # Personalized learning path
│   └── ...other pages
├── css/
│   ├── styles.css      # Design tokens and base styles
│   ├── clay-morphism.css # Tactile utility classes
│   ├── glass-fx.css    # Backdrop blur effects
│   └── ...component styles
└── js/
    ├── app-state.js    # Set-based Observer state manager
    ├── services/
    │   ├── storage.js  # Unified persistence layer
    │   ├── workflow.js # Process state machine
    │   └── ...API services
    ├── interview/      # Modular interview sub-system
    │   ├── logic.js
    │   ├── timer.js
    │   └── ui.js
    ├── data/           # Normalized static data
    └── ...core logic
```

---

## ⚡ Quick Start (3 Minutes)

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/sameerreddy789/CareerPilot.git
    cd CareerPilot
    npm install
    ```

2.  **Configure Keys**:
    -   Copy `js/env-config.example.js` to `js/env-config.js`.
    -   Open `js/env-config.js` and paste your **Firebase**, **SerpAPI**, and **Gemini** keys.

3.  **Run**:
    ```bash
    npm run dev
    ```
    Go to `http://localhost:5173` and start your career journey!

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+) and **npm**.
- A **Firebase Project** (Free tier works perfectly).
- A **Google Gemini API Key** (from Google AI Studio).
- A **SerpAPI Key** (for live market data).

### Step-by-Step Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment Config**
   NextStep AI uses a client-side environment configuration for ease of development. Rename the example file:
   ```bash
   cp js/env-config.example.js js/env-config.js
   ```
   *Note: `js/env-config.js` is ignored by git to keep your keys secure.*

3. **Paste Your Keys**
   Open `js/env-config.js` in your editor and fill in the values from your service dashboards.

4. **Launch Development Server**
   ```bash
   npm run dev
   ```

---

## 🤝 Contributing

This project is now structured for scale. Please follow the modular patterns established in `js/services` and `js/interview` when adding new features. Refer to `docs/REFACTORING_PLAN.md` for historical context.

---

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**© 2026 NextStep AI. Built with ❤️ for the future of career prep.**
