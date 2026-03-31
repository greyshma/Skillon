# 🧠 Skillon – Hyper-Personalized Learning & Career Optimizer


**Skillon** is a dynamic, next-generation learning and career roadmap platform built to conquer traditional, rigid learning systems. Instead of enforcing linear course lists, Skillon leverages an AI-driven **Capability Graph** to craft hyper-personalized, adaptive paths that align with your timeline, mood, and skill level in real time. 

It is designed to give you options, check your reality, simulate advice from your "Future Self," and correct your misconceptions as you build your career.

---

## 🚀 The Vision: Why We Built Skillon

Most apps force users into static quizzes or one-size-fits-all roadmaps. Skillon was built for hackathons and the future of ed-tech. It is:
- **Adaptive:** Re-routes learning paths based on daily interactions.
- **Human-Like:** Reads your "mood" and energy levels to adjust the depth of tasks.
- **Realistic:** Offers opportunity cost breakdowns and timeline realities before you jump into a career.

---

## 🧩 Core Platform Features

### 1. The Calibration 
- **What it does:** Replaces generic questionnaires with a high-stakes, 4-step diagnostic flow (Goal -> Tag Cloud -> Self-Calibration -> Diagnostic Postgres task).
- **Tech Logic:** Uses OpenAI (GPT-4) to read free-text answers and locate exact percentage gaps in your knowledge, routing you safely away from beginner material directly to advanced architectural nodes.

### 2. Capability Graph (Backend engine: SkillForge)
- **What it does:** Represents learning as a vibrant graph of interconnected concepts. It visualizes the *why* behind prerequisites and dependencies. 
- **Tech Logic:** Nodes represent skills. Progress automatically recalculates topological paths on the fly.

### 3. Personalized Career Roadmap
- **What it does:** Generates hyper-focused 8-week tracks for targeting explicit product companies (e.g. Razorpay, Swiggy) rather than general fields.

---

## 🌟 Unique Differentiators (Hackathon Winners)

### 🌡️ Mood Shifter (Emotion Engine)
- Adapts tasks completely based on your daily energy. Feeling "Lazy"? It suggests a quick 5-min video. Feeling "Motivated"? It challenges you to build a micro-project.
- *Nobody builds apps that account for the user's human burnout phase. This feature is our signature.*

### 🔮 FutureYou AI (Guidance Layer)
- Your personal LLM-based narrator. Expect advice like: *"I’m you 5 years later from a senior dev role. Skip focusing on Redux today and let’s master Zustand—trust me, it saved us hours in 2026."*

### ⏳ Reality Check Engine
- Grounds ambition into reality. By pulling API metrics on job demand, time-to-learn, and effort gaps, it shows you the *absolute opportunity cost* of pursuing a specific node in your graph.

### 🧭 Confused Mode
- Don’t know what to build? Skillon analyzes your personality traits through natural language and gently guides you into the Capability Graph based on your latent interests.

### ⚔️ AI Challenge Mode
- Unlike apps that trust self-assessments ("I know HTML"), Skillon challenges your reasoning in real time and highlights weak nodes in red if you possess knowledge gaps.

---

## 🎨 Premium UI / UX Design System
- **Deep Glassmorphism:** Features a beautifully crafted dark-mode palette (`#050508` background) combined with 24px blurred "frosted glass" panels.
- **Fluid Micro-Animations:** Custom cubic-bezier spring animations give the interface a premium, responsive, and tactile feel.
- **Animated Ambient Mesh:** Spatial glowing orbs drift behind the interface to offer a truly modern Next-Gen aesthetic.

---

## 💻 Tech Stack Overview

- **Frontend Interface:** Pure HTML, CSS (Custom Design System with Variables), and Vanilla JS (`app.js`).
- **Graph Visualization:** `vis-network.js` for dynamic rendering of user skills directly to the DOM.
- **Backend Infrastructure:** Node.js with Express (`server.js`) for lightweight API simulation and REST endpoints.

---

## ⚙️ Getting Started (Local Development)

It takes 30 seconds to get the environment running locally.

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd skillon
   ```
2. **Install dependencies:**
   ```bash
   npm install
   npm install dotenv
   ```
3. **Configure OpenAI (Crucial!):**
   Create a `.env` file in the root directory and add your key:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```
   *(If you don't add a key, Skillon will gracefully degrade into "Offline/Mock Mode" to prevent crashes).*
   
4. **Run the local Node Server:**
   ```bash
   npm start
   ```
5. **View the App:**
   Open http://localhost:3000 in your browser to interact with the Capability Graph!

---

## 🤝 Roadmap & Future Implementations

- **Phase 2:** Integrate live Neo4j database graph queries to handle tens of thousands of dynamic job clusters.
- **Phase 3:** Integrate complete LLM micro-service handling for "FutureYou AI".
- **Phase 4:** Expand Opportunity Cost computations via Glassdoor / LinkedIn APIs.
## Preview of the app
![alt image](https://github.com/greyshma/Skillon/blob/c08856d768fdf54ad2334e62e6d948d4cdfc7fc8/Screenshot%202026-03-31%20184918.png)
![img alt](https://github.com/greyshma/Skillon/blob/c08856d768fdf54ad2334e62e6d948d4cdfc7fc8/Screenshot%202026-03-31%20185011.png)
![image alt](https://github.com/greyshma/Skillon/blob/c08856d768fdf54ad2334e62e6d948d4cdfc7fc8/Screenshot%202026-03-31%20185048.png)
![image alt](https://github.com/greyshma/Skillon/blob/c08856d768fdf54ad2334e62e6d948d4cdfc7fc8/Screenshot%202026-03-31%20185105.png)
![image alt](https://github.com/greyshma/Skillon/blob/c08856d768fdf54ad2334e62e6d948d4cdfc7fc8/Screenshot%202026-03-31%20185124.png)
![image alt](https://github.com/greyshma/Skillon/blob/c08856d768fdf54ad2334e62e6d948d4cdfc7fc8/Screenshot%202026-03-31%20185141.png)
![image alt](https://github.com/greyshma/Skillon/blob/c08856d768fdf54ad2334e62e6d948d4cdfc7fc8/Screenshot%202026-03-31%20185236.png)
![image alt](https://github.com/greyshma/Skillon/blob/c08856d768fdf54ad2334e62e6d948d4cdfc7fc8/Screenshot%202026-03-31%20185305.png)
![image alt](https://github.com/greyshma/Skillon/blob/c08856d768fdf54ad2334e62e6d948d4cdfc7fc8/Screenshot%202026-03-31%20185335.png)
![image alt](https://github.com/greyshma/Skillon/blob/c08856d768fdf54ad2334e62e6d948d4cdfc7fc8/Screenshot%202026-03-31%20185401.png)
![image alt](https://github.com/greyshma/Skillon/blob/c08856d768fdf54ad2334e62e6d948d4cdfc7fc8/Screenshot%202026-03-31%20185434.png)

****

*Built with ❤️ for a hyper-personalized future of education.*
