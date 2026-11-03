# MathLab – Explore, Visualize & Master Mathematics

**Course Project:** ICT in Education — Indian Institute of Technology (IIT) Kharagpur  
**Target Audience:** Class 10 Students (Ages 14–16)  
**Curriculum Alignment:** NCERT / CBSE Class 10 Mathematics — **Chapter 3: Pair of Linear Equations in Two Variables**  
**Tech Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Recharts + Lucide React + LocalStorage

---

## 1. Project Overview & Pedagogical Architecture

**MathLab** transforms passive textbook reading into an interactive mathematical laboratory grounded in five core educational learning theories:

1. **Constructivist Learning Theory**: Students manipulate sliders for $a_1, b_1, c_1$ and $a_2, b_2, c_2$ in the **Interactive Graph Laboratory** and observe how slope and intercept ratios govern whether two lines intersect, remain parallel, or coincide.
2. **Experiential Learning**: Students test candidate coordinates $(x, y)$ in real time, inspect projections onto the $X$ and $Y$ axes, and transfer plotted systems directly into the **Step-by-Step Algebraic Solver**.
3. **Scaffolding**: All 8 conceptual modules, the 3 algebraic solvers, and the **Practice Zone** reveal steps progressively and provide targeted hints before revealing full solutions.
4. **Immediate Diagnostic Feedback**: Incorrect answers in the Practice Zone diagnose the specific misconception (such as swapping $(x, y)$ coordinates, forgetting the sign when moving $c$, or confusing *Consistent* with *Unique Solution only*).
5. **Mastery Learning**: Students track their progress via `localStorage`, retry the 10-question **Final Assessment**, inspect their topic-wise accuracy bar chart, and jump directly to recommended revision lessons.

---

## 2. Folder Structure

```text
mathlab-vite-project/
├── index.html                  # App entry HTML (Inter, JetBrains Mono & KaTeX CSS)
├── package.json                # Dependencies & build scripts
├── tsconfig.json               # Strict TypeScript configuration
├── vite.config.ts              # Vite bundler config
├── tailwind.config.js          # Tailwind utility & typography config
├── postcss.config.js           # PostCSS pipeline
├── vercel.json                 # Zero-config Vercel SPA deployment rules
├── netlify.toml                # Zero-config Netlify SPA build & redirect rules
├── README.md                   # Complete documentation, deployment guide & test checklist
└── src/
    ├── main.tsx                # React DOM root mount
    ├── index.css               # Tailwind directives & base styles
    ├── App.tsx                 # Complete unified MathLab application & module router
    └── utils/
        └── mathEngine.ts       # Standalone determinant, ratio & line-clipping calculations
```

---

## 3. Local Installation & Execution Instructions

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9+ included with Node.js)

### Step-by-Step Setup
```bash
# 1. Extract mathlab-vite-project.zip and navigate into the project folder
cd mathlab-vite-project

# 2. Install all dependencies
npm install

# 3. Start the local development server with Hot Module Replacement (HMR)
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### Production Build & Local Preview
```bash
# Type-check with TypeScript and build optimized static bundle into dist/
npm run build

# Preview the production build locally
npm run preview
```

---

## 4. Free Public Deployment Guide (Vercel & Netlify)

Because MathLab is a 100% client-side application using `localStorage` with zero paid APIs or backend dependencies, you can deploy it publicly for free in under 60 seconds:

### Option A: Deploy to Vercel (Recommended — Instant URL)
1. **Via Vercel CLI (Fastest — No Git setup required)**:
   ```bash
   npx vercel --prod
   ```
   Follow the terminal prompts (log in with GitHub/Google, accept default settings), and Vercel will immediately output your live public URL (e.g., `https://mathlab-iitkgp.vercel.app`).
2. **Via GitHub + Vercel Dashboard**:
   - Push this folder to a GitHub repository.
   - Visit [https://vercel.com/new](https://vercel.com/new) and import your repository.
   - Framework Preset is automatically detected as **Vite** (`npm run build`, output directory `dist`).
   - Click **Deploy**.

### Option B: Deploy to Netlify (Drag-and-Drop or Git)
1. **Via Netlify Drop (Zero CLI required)**:
   - Run `npm run build` locally to generate the `dist/` folder.
   - Visit [https://app.netlify.com/drop](https://app.netlify.com/drop) and drag-and-drop the `dist/` folder directly into the browser window for an instant live URL.
2. **Via Netlify CLI**:
   ```bash
   npx netlify-cli deploy --prod --dir=dist
   ```

---

## 5. Notes on This Reconstructed Project

The original files supplied for reconstruction were `App.tsx`, `main.tsx`, `index.css`, and this README. The missing Vite/TypeScript/Tailwind configuration and dependency files have been added so the project has a conventional runnable structure.

**Important implementation detail:** the mathematical analysis routines are currently implemented inside `src/App.tsx`. The README's earlier reference to a separate `src/utils/mathEngine.ts` was not supported by the supplied source code, so no unused math-engine file has been fabricated.

The app is browser-based and stores progress in that browser's `localStorage`. It does not include a server, database, or account synchronization. The supplied source also contains a pre-filled demo student/progress state; change or reset it in the app if you want a clean student profile.

The checklist below was present in the supplied README. It describes intended/claimed test cases, **not tests independently verified during this reconstruction**. Run the build and manually test the features before presenting or deploying the project.

## 6. Comprehensive Testing Checklist

| # | Module / Feature | Test Case Description | Expected Mathematical & UI Outcome | Status |
|:-:|:---|:---|:---|:---:|
| 1 | **Home Dashboard** | Edit student name, inspect progress bar, click module navigation cards & *Start Learning* | Name & progress persist in `localStorage`; all 7 modules load smoothly | ✅ Pass |
| 2 | **Learn Module (8 Topics)** | Navigate all 8 NCERT sections (3.1 to 3.8), test interactive $(x,y)$ slider, reveal step-by-step solutions, answer Quick Checks | $	ext{LHS} = 	ext{RHS}$ updates live; misconception boxes & step reveals work; +15 XP awarded on mastery | ✅ Pass |
| 3 | **Graph Lab – Case 1 (Unique)** | Load Preset 1 ($2x + y = 7,\; x - y = 2$) or adjust sliders so $a_1/a_2 
eq b_1/b_2$ | Lines cross at $(3, 1)$; green intersection marker & dashed axis projections appear; badge shows *Intersecting Lines • Consistent (Independent)* | ✅ Pass |
| 4 | **Graph Lab – Case 2 (Parallel)** | Load Preset 2 ($x + 2y = 4,\; 2x + 4y = 12$) where $a_1/a_2 = b_1/b_2 
eq c_1/c_2$ | Parallel lines plotted with equal slope $-0.5$; no intersection marker; badge shows *Parallel Lines • Inconsistent* | ✅ Pass |
| 5 | **Graph Lab – Case 3 (Coincident)** | Load Preset 3 ($2x + 3y = 6,\; 4x + 6y = 12$) where $a_1/a_2 = b_1/b_2 = c_1/c_2$ | Overlapping dual-styled coincident line with glow; badge shows *Coincident Lines • Consistent (Dependent)* | ✅ Pass |
| 6 | **Graph Lab – Zero / Edge Cases** | Set $b_1 = 0, a_1 = 1, c_1 = 4$ (vertical line $x = 4$) and $a_2 = 0, b_2 = 1, c_2 = -3$ (horizontal line $y = -3$); also test $a_1 = 0, b_1 = 0$ | Vertical & horizontal lines intersect cleanly at $(4, -3)$ with zero `NaN` or division-by-zero errors; degenerate $0x+0y=c$ displays clear warning | ✅ Pass |
| 7 | **Step-by-Step Solver** | Test Substitution, Elimination, and Cross-Multiplication on unique, parallel, and coincident pairs | All steps & mathematical reasoning render; final $(x,y)$ is verified by substituting back into both original equations | ✅ Pass |
| 8 | **Practice Zone** | Test Beginner, Intermediate, and Advanced questions across MCQ, Numerical, Graph, and Conceptual formats | Wrong answers display targeted misconception diagnostics & scaffolding hints rather than dumping the answer | ✅ Pass |
| 9 | **Challenge Arena** | Answer Cadet/Scholar/Olympiad challenges, build streak, solve Daily Taxi Word Problem | XP, current streak, best streak, and 6 Achievement Badges unlock automatically | ✅ Pass |
| 10 | **Final Assessment** | Complete 10-question exam and submit | Total marks, percentage, Recharts topic-wise accuracy bar chart, and 1-click revision links render and persist in `localStorage` | ✅ Pass |
