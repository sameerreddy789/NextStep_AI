# NextStep AI 🚀

> **Your AI-Powered Career Co-Pilot** — Bridging the gap between where you are and where you want to be.

![NextStep AI](https://img.shields.io/badge/Status-Active-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![Version](https://img.shields.io/badge/Version-1.0-orange)

---

## 📋 Overview

NextStep AI is an intelligent career guidance platform that helps students, freshers, and career switchers navigate their path to success. The platform combines AI-powered resume analysis, adaptive mock interviews, personalized learning roadmaps, and skill gap analysis to provide a comprehensive career preparation experience.

---

## ✨ Features

### 🎯 Smart Resume Analysis
- **AI-Powered Skill Extraction** — Automatically detects and categorizes your technical and soft skills
- **ATS Compatibility Score** — Evaluates how well your resume performs with Applicant Tracking Systems
- **Missing Skills Detection** — Identifies critical skills you need for your target role
- **Experience & Project Analysis** — Extracts and evaluates your work experience and projects

### 🎤 Adaptive AI Interviews
- **Adaptive/Adaptive Logic** — Intelligently mixes Technical (Code) and Behavioral (Speech) questions
- **Dynamic Response Tools**:
  - **Code Editor** — Monaco-style editor for coding questions
  - **Speech-to-Text** — Real-time transcription for behavioral questions
- **Live Proctoring Simulation** — Webcam feed for realistic interview pressure
- **Timed Responses** — Adaptive timers (longer for code, shorter for speech)
- **Progress Tracking** — Track your performance across sessions

### 🗺️ Personalized Learning Roadmap
- **6-Week Structured Plan** — Week-by-week learning path based on your skill gaps
- **Dynamic Resource Integration** — Live YouTube tutorials and LeetCode problems fetched via SerpAPI
- **Task Management** — Interactive checklist with learn, practice, and interview tasks
- **Progress Visualization** — Track completion and stay motivated
- **🎉 Completion Celebration** — Congratulatory popup when you finish all tasks with:
  - **Job Application Links** — Direct access to LinkedIn, Indeed, AngelList, Internshala, and remote job boards
  - **Related Skills Suggestions** — Role-specific skill recommendations to level up further

### 📊 Comprehensive Dashboard
- **Job Readiness Score** — Real-time assessment of your interview readiness
- **Weekly Progress Charts** — Visual representation of your learning journey
- **Skills Coverage Metrics** — Track skills covered vs. skills needed
- **Day Streak Counter** — Stay consistent with gamified motivation

### 👤 User Profiles & Navigation
- **Simplified Sidebar** — Clean navigation with direct Profile access
- **Smart User Tab** — Single click to access profile, no hidden menus
- **Streamlined Logout** — Secure logout from profile page, redirects to landing
- **Activity Heatmap** — Github-style visualization of your daily learning progress

### 🚀 Onboarding Wizard
- **Multi-step Flow** — Guided setup for personalized experience
- **Career Goal Setting** — Define your path (Student, Professional, etc.)
- **Interactive Resume Upload** — Drag & drop interface
- **Seamless Transition** — Auto-redirects to resume analysis upon completion

### 🔐 Authentication
- **Firebase Auth** — Secure Email/Password & Google Sign-In
- **Cloud Persistence** — User profiles stored in Firestore
- **Smart Redirection** — New users guided to onboarding automatically

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Structure and semantics |
| **CSS3** | Styling with modern design patterns |
| **Vanilla JavaScript** | Core functionality and interactivity |
| **Firebase Auth** | User authentication & Identity |
| **Cloud Firestore** | NoSQL database for user data |
| **GSAP** | Smooth animations and transitions |
| **Inter Font** | Modern, clean typography |

---

## 📁 Project Structure

```
NextStep-AI/
├── index.html          # Landing page with hero section
├── auth.html           # Authentication (Login/Signup)
├── onboarding.html     # Multi-step Onboarding Wizard
├── dashboard.html      # User dashboard with stats
├── resume.html         # Resume upload and analysis
├── interview.html      # AI mock interview system
├── skill-gap.html      # Skill gap analysis
├── roadmap.html        # Personalized learning roadmap
├── profile.html        # User profile management
├── feedback.html       # Interview feedback display
├── css/
│   ├── styles.css      # Main stylesheet
│   ├── onboarding.css  # Onboarding wizard styles
│   ├── pill-nav.css    # Navigation styles
│   ├── stepper.css     # Stepper component
│   └── orbital-timeline.css
└── js/
    ├── firebase-config.js # Firebase configuration
    ├── auth-modern.js  # Auth logic
    ├── onboarding.js   # Onboarding logic
    ├── store.js        # Data management
    ├── sidebar.js      # Sidebar component
    ├── pill-nav.js     # Navigation component
    ├── stepper.js      # Stepper UI
    ├── orbital-timeline.js
    └── infinite-plane.js
```

---

## 📊 Visual Documentation

### System Architecture
![Architecture Diagram](architecture-diagram.png)
*Complete system architecture showing client layer, application flow, and backend services*

### User Journey Flow
![User Flow](user-flow-diagram.png)
*Sequential user journey from landing to dashboard (16:9 format)*

### UI Wireframes
![UI Wireframes](ui-wireframes.png)
*Key screen wireframes: Landing, Dashboard, Interview, and Roadmap pages*

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- No build tools required! (Uses ES Modules)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sameerreddy789/CareerPilot.git
   ```

2. **Navigate to the project**
   ```bash
   cd CareerPilot
   ```

3. **Open in browser**
   - Simply open `index.html` in your browser
   - **Recommended:** Use VS Code "Live Server" to handle ES Modules gracefully

---

## 🎮 How to Use

1. **Sign Up** — Create accounts with Email or Google
2. **Complete Onboarding** — Tell us about your goals and upload your resume
3. **View Dashboard** — See your personalized readiness score
4. **Take Mock Interviews** — Practice with AI-powered questions
5. **Follow Roadmap** — Complete your learning plan
6. **Celebrate & Apply** — Finish roadmap, get job links, explore advanced skills

---

## 🎨 Design Philosophy

- **Dark Theme** — Easy on the eyes for extended study sessions
- **Glassmorphism Effects** — Modern, premium feel
- **Responsive Layout** — Works on desktop, tablet, and mobile
- **Micro-animations** — Delightful interactions throughout
- **Accessibility First** — Clear contrast and semantic HTML

---

## 👥 Target Audience

| User Type | Use Case |
|-----------|----------|
| **Students** | Prepare for campus placements with mock interviews |
| **Freshers** | Bridge the gap between academics and industry |
| **Career Switchers** | Transition smoothly to a new domain |
| **Returning Professionals** | Update skills after a career gap |

---

## 🔮 Future Roadmap

- [ ] Video interview analysis
- [ ] Company-specific interview prep
- [ ] Peer mock interviews
- [ ] Mobile app version

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Sameer Reddy**  
Built with ❤️ for Hackathon

---

<p align="center">
  <strong>© 2026 NextStep AI. All rights reserved.</strong>
</p>
