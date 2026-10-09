# ⚡ AI Tax Copilot — Personal Tax Engine & AI Assistant (FY 2025–26)

> **Deterministic statutory calculations, immutable Tax Twin lifecycle, AIS conflict resolution, and conversational Gemma 2 AI guidance for Indian taxpayers.**

---

## 📌 Problem Statement

Every year, over 70 million Indian taxpayers struggle with the complexity of filing taxes:
1. **Regime Confusion**: The latest Union Budget introduced new tax slabs for FY 2025–26 (AY 2026–27), revised Section 87A rebate thresholds (up to ₹12 Lakhs), and standard deductions (₹75,000). Taxpayers don't know which regime saves them the most money.
2. **Tax Demand Notices from AIS Mismatches**: Undeclared bank interest or dividend income reported in the Annual Information Statement (AIS) leads to costly penalty notices under Section 234B/C.
3. **Hallucinating AI & Lack of Audit Trails**: Generic LLMs make numerical errors when calculating progressive tax brackets, and conventional tax portals overwrite historical data without an audit log.

---

## 🚀 The Solution: AI Tax Copilot

**AI Tax Copilot** solves this by uniting **100% deterministic, audit-proof tax arithmetic** with **Gemma 2 AI conversational intelligence**:

* **Deterministic Statutory Engine**: Pure TypeScript engine strictly implementing Section 115BAC, Section 87A, Section 16(ia), Chapter VI-A, and Section 288A/B rounding rules. Zero hallucinated math.
* **Immutable "Tax Twin" Lifecycle**: Versioned digital replica ($v_1 \rightarrow v_2 \rightarrow v_3$) of taxpayer income facts stored in PostgreSQL via Prisma. Historical states are never erased.
* **AIS & Document Intelligence**: Detects discrepancies between declared Form 16 facts and official AIS reports (e.g. ₹12,000 declared vs ₹18,500 in AIS) and reconciles with a single click.
* **What-If Scenario Sandbox**: Test tax-saving maneuvers (such as Section 80CCD(1B) NPS contributions) without modifying the authoritative filing state.
* **Compliance & Deadlines Calendar**: Tracks quarterly advance tax dates, non-audit ITR deadlines (July 31), and belated returns (Dec 31).
* **Gemma 2 AI Copilot**: Instant conversational tax assistant powered by Google's Gemma 2 open model via Groq, providing plain-English explanations with full statutory grounding.

---

## 🏛️ Statutory Legal Rules Implemented

| Section / Rule | Description & Statutory Baseline |
| :--- | :--- |
| **Section 115BAC** | **New Tax Regime Slabs (FY 2025–26)**: ₹0–4L: Nil; ₹4–8L: 5%; ₹8–12L: 10%; ₹12–16L: 15%; ₹16–20L: 20%; ₹20–24L: 25%; Above ₹24L: 30%. |
| **Section 87A** | **Tax Rebate**: Full rebate up to **₹60,000** for resident individuals with net taxable income $\le$ ₹12,00,000 under New Regime (effectively **zero tax up to ₹12.75 Lakhs** with standard deduction), plus statutory marginal relief. Old regime rebate up to ₹12,500 for income $\le$ ₹5,00,000. |
| **Section 16(ia)** | **Standard Deduction**: ₹75,000 under New Regime (₹50,000 under Old Regime). |
| **Section 80C** | Cap of **₹1,50,000** on eligible investments (EPF, PPF, ELSS, Life Insurance, Tuition Fees) for Old Regime. |
| **Section 80D** | Health insurance premium deductions up to **₹25,000** (self/family) + senior citizen limits. |
| **Section 80CCD(1B)** | Additional deduction up to **₹50,000** for voluntary NPS contributions (evaluated in What-If Sandbox). |
| **Section 80CCD(2)** | Employer NPS contributions (up to 14% Govt / 10% Private) deductible under **both** regimes. |
| **Section 10(13A)** | House Rent Allowance (HRA) exemption calculated per **Rule 2A** (lowest of 3 statutory limits). |
| **Section 24(b)** | Home loan interest deduction up to **₹2,00,000** on self-occupied properties (Old Regime). |
| **Section 288A & 288B** | Statutory rounding off of taxable income and final tax liability to nearest multiple of **₹10**. |
| **Health & Edu Cess** | **4%** levied on aggregate Income Tax + Surcharge per the Finance Act. |
| **Section 285BA** | Statement of Financial Transactions (SFT) cross-verification for AIS interest reconciliation. |
| **Section 139** | Statutory compliance tracking for ITR-1 / ITR-2 filing and Advance Tax installments (Sec 208/211). |

---

## 🛠️ Tech Stack & Architecture

* **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Vanilla CSS design system
* **Deterministic Backend**: Node.js, Next.js Server-Side APIs, Decimal.js, Zod validation
* **Database & ORM**: PostgreSQL (Supabase / Neon / Local Docker), Prisma 6
* **AI & LLM**: Google Gemma 2 (`gemma2-9b-it`) via Groq Cloud API, Google Generative AI SDK
* **Testing**: Vitest, TypeScript static typechecker

```
                       ┌───────────────────────────────┐
                       │     Next.js User Interface    │
                       │   (Dashboard, Tabs, Sandbox)  │
                       └───────────────┬───────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
     ┌─────────────────────────────┐       ┌─────────────────────────────┐
     │  Deterministic Tax Engine   │       │     Gemma 2 AI Copilot      │
     │   - Slabs & Rebate 87A      │       │   - Natural Language Tax    │
     │   - Chapter VI-A Deductions │       │   - Statutory Explanations  │
     │   - Sec 288A/B Rounding     │       │   - Zero Hallucinated Math  │
     └──────────────┬──────────────┘       └──────────────┬──────────────┘
                    │                                     │
                    ▼                                     ▼
     ┌─────────────────────────────┐       ┌─────────────────────────────┐
     │  Immutable Tax Twin (Prisma)│       │      Groq Cloud API /       │
     │   - Versioning (v1 -> v2)   │       │   Google AI Studio Engine   │
     │   - PostgreSQL Storage      │       └─────────────────────────────┘
     └─────────────────────────────┘
```

---

## 📦 Quick Start & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/SaiRanjithR/HackDays_TAX.git
cd HackDays_TAX/Mlhdays
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Add your database and API credentials inside `.env`:
```env
# PostgreSQL Database (e.g. Supabase / Neon / Local PostgreSQL)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Groq Cloud API Key (Powers ultra-fast Gemma 2: gemma2-9b-it)
# Free key available at: https://console.groq.com/keys
GROQ_API_KEY="gsk_your_groq_api_key_here"

# Model Selection
GEMMA_MODEL_NAME="gemma2-9b-it"

# Environment
NODE_ENV="development"
```

### 4. Push Database Schema & Generate Types
```bash
npx prisma db push
npx prisma generate
```

### 5. (Optional) Seed Demo Taxpayer Facts
```bash
npm run prisma:seed
```

### 6. Start the Development Server
```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Testing & Validation

All tax arithmetic and edge cases are validated against 16 automated tests covering slab boundaries, Section 87A rebate edge conditions, and Tax Twin immutability:

```bash
# Run test suite:
npm test

# Run build & TypeScript check:
npm run build
```

**Test Coverage Summary**:
* `tests/tax-engine.test.ts`: 10/10 passed (Slab boundaries, 87A marginal relief, 80C caps, New vs Old comparison)
* `tests/api-stateless.test.ts`: 4/4 passed (Stateless calculation API endpoint contracts)
* `tests/tax-twin.test.ts`: 2/2 passed (Immutable versioning $v_1 \rightarrow v_2$, foreign key integrity)

---

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| **`/api/v1/tax/calculate/stateless`** | `POST` | Deterministic tax engine. Returns regime comparison, slab tax, rebate, cess, and itemized calculation trace. |
| **`/api/v1/tax/copilot`** | `POST` | AI Tax Copilot powered by Gemma 2 with statutory prompt grounding and tool-calling integration. |
| **`/api/v1/tax/twin`** | `POST` | Creates or forks an immutable Tax Twin version snapshot in PostgreSQL. |
| **`/api/v1/tax/twin/[id]`** | `GET` | Retrieves full snapshot and active facts for a specific Tax Twin version. |
| **`/api/v1/tax/twin/[id]/scenario`**| `POST` | Runs a sandbox What-If simulation against a Tax Twin. |
| **`/api/v1/tax/twin/[id]/readiness`**| `GET` | Computes filing readiness score and audit verification gates. |
| **`/api/v1/tax/deadlines`** | `GET` | Returns official statutory compliance dates and advance tax schedule. |

---

## 👥 Contributors

* **Sai Ranjith R** — Full-stack Architecture, Deterministic Tax Engine, Tax Twin Lifecycle, and Gemma AI Copilot Integration
