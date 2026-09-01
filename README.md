# CASCADE

**Counterfactual Infrastructure Cascade Analysis & Decision Engine**

CASCADE is a prototype decision-support engine, not a production SCADA,
EMS, or full AC/DC power-flow simulator.

---

## 1. Project Overview

CASCADE is a decision-support prototype that:

1. Starts from an infrastructure contingency/failure.
2. Models how the disturbance can propagate.
3. Calculates resulting impact.
4. Compares feasible corrective actions.
5. Recommends an action.
6. Stress-tests that decision against independent secondary shocks.

It is aimed at helping an operator or analyst reason about "what happens
if X fails, and what should we do about it" — not at controlling real
infrastructure.

---

## 2. Key Features

Currently implemented:

- Cascade propagation simulation
- Infrastructure impact calculation
- Counterfactual intervention comparison
- Recommendation engine
- Independent second-shock resilience verification
- Real-world case-study layer
- Domain-specific actions
- Evidence classification
- Case-study dashboard
- Tamil Nadu grid case
- Chennai hospital case
- Data-center UPS case
- Synthetic stress scenarios

Case-study results are generated from the implemented case-study models at
runtime (not pre-recorded), and every value shown is clearly classified as
one of:

- **VERIFIED**
- **UNCONFIRMED — SECONDARY EXTRACTION**
- **MODELLED**
- **DERIVED**

---

## 3. System Requirements

Supported platforms:

- Windows 10/11
- macOS
- Linux

Requirements:

- [Git](https://git-scm.com/)
- [Node.js 20 LTS](https://nodejs.org/) or newer
- npm (included with Node.js)

An active Node.js LTS release is recommended.

CASCADE runs on any supported Windows, macOS, or Linux system with
Node.js installed.

No Python, database, Docker, GPU, or external API is required to run this
MVP.

---

## 4. Installation — Windows

### 1. Install Node.js

Install Node.js LTS from the [official Node.js website](https://nodejs.org/).

After installation, open PowerShell or Command Prompt and verify:

```powershell
node --version
npm --version
```

### 2. Clone the repository

```powershell
git clone https://github.com/Sam240107/cascade---new.git
cd cascade---new
```

### 3. Install dependencies

```powershell
npm install
```

### 4. Start CASCADE

```powershell
npm run dev
```

Vite will print a local address, for example:

```
Local:   http://localhost:3000/
```

Open that address in a browser.

---

## 5. Installation — macOS

### 1. Install Node.js LTS

Install Node.js LTS from the [official Node.js website](https://nodejs.org/).
(Optionally via [Homebrew](https://brew.sh/) — `brew install node` — if you
already use it; Homebrew is not required.)

Verify:

```bash
node --version
npm --version
```

### 2. Clone the repository

```bash
git clone https://github.com/Sam240107/cascade---new.git
cd cascade---new
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start CASCADE

```bash
npm run dev
```

Open the local URL printed by Vite (e.g. `http://localhost:3000/`).

---

## 6. Installation — Linux

```bash
git clone https://github.com/Sam240107/cascade---new.git
cd cascade---new
npm install
npm run dev
```

Then open the local URL printed by Vite.

---

## 7. Available Commands

The commands below are exactly the scripts defined in `package.json`.

| Command | What it does |
|---|---|
| `npm install` | Installs all project dependencies. |
| `npm run dev` | Starts the Vite development server (`http://localhost:3000` by default). |
| `npm run build` | Creates the optimized production build in `dist/`. |
| `npm run preview` | Serves the production build locally for verification. |
| `npm test` | Runs the automated test suite (simulation engine + case-study tests). |
| `npm run lint` | Type-checks the source code with `tsc --noEmit`. |

Acceptance-test scripts (run the real engine end-to-end and print a
console summary — used to sanity-check calculated results, not part of
the automated test suite):

| Command | What it does |
|---|---|
| `npm run acceptance-test` | Runs the synthetic Urban Grid scenario through the core cascade engine and prints the calculated results. |
| `npm run case-study-acceptance` | Runs all three real-world case studies through the engine and prints a summary, distinguishing VERIFIED / MODELLED / DERIVED values. |
| `npm run domain-action-acceptance` | Runs a domain-action audit per case study, showing which actions are actually supported by the engine versus honestly marked as future/unsupported. |

---

## 8. Production Build

Build the app:

```bash
npm run build
```

Then serve the build locally to verify it:

```bash
npm run preview
```

This verifies the production build locally. It does not deploy the
application to any cloud service.

---

## 9. First-Run Guide

**Running CASCADE for the first time:**

1. Start the dev server (`npm run dev`).
2. Open the browser URL Vite prints.
3. Go to **Scenarios**.
4. Choose one of the Real-World Case Studies.
5. Review the case context.
6. View the cascade impact.
7. Open **Simulation**.
8. Review the recommended action.
9. Open **Verification** to see the independent second-shock result.

The three flagship case studies are:

- **Tamil Nadu Grid**
- **Chennai Hospital**
- **Data Center UPS**

---

## 10. Troubleshooting

### "node is not recognized"

Node.js is not installed or is not available in PATH. Install/reinstall
Node.js LTS and restart the terminal.

### `npm install` fails

Try:

```bash
npm cache verify
```

Then run:

```bash
npm install
```

### Port 3000 is already in use

Vite may automatically choose another available port, or you can stop
the process currently using port 3000.

### Browser does not open

Copy the localhost URL printed by `npm run dev` and open it manually.

---

## 11. Project Structure

```
src/
  caseStudies/   Real-world case-study models, runner, and domain actions
  simulation/    Core cascade propagation, impact, recommendation, and verification engine
  pages/         Top-level application pages (Overview, Scenarios, Simulation, Verification, ...)
  components/    Reusable UI building blocks (cards, layout, modals)
  state/         Application-wide state and context
  types/         Shared TypeScript domain types
  data/          Synthetic scenario data
```

---

## 12. Architecture

```
Real-World Incident / Synthetic Scenario
                ↓
        Modelled Network
                ↓
       Cascade Simulation
                ↓
          Impact Analysis
                ↓
       Candidate Actions
                ↓
       Recommendation
                ↓
    Independent Second Shock
                ↓
      Resilience Verification
```

The frontend presents these computed results — it does not alter or
pre-compute them; every value shown is the output of the pipeline above,
run live in the browser.

---

## 13. Data / Evidence Disclaimer

- Real-world incident context comes from documented public sources.
- Some case evidence is **VERIFIED**.
- Tamil Nadu case evidence that could not be directly confirmed is
  explicitly marked **UNCONFIRMED — SECONDARY EXTRACTION**.
- Network values used for counterfactual simulation are **MODELLED**.
- Simulation and verification outcomes are **DERIVED** from the
  implemented model and should not be interpreted as historical
  measurements.

The model is a representative reconstruction, not an exact reproduction
of the real physical grid or facility.

---

## 14. Limitations / Future Production Work

The current MVP does **not** provide:

- Live SCADA/EMS integration
- Real-time grid telemetry
- Full AC/DC power-flow solving
- State estimation
- Production-grade N-1/N-k analysis
- Utility control
- Automatic physical actuation

A production infrastructure deployment would require these in addition
to what is implemented here.

---

## 15. Browser / Platform

CASCADE is a browser-based Vite application. Start the local development
server and open the printed URL in a modern browser to use it.

---

## License

Not specified.
