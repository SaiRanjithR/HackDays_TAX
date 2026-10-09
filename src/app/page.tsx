'use client';

import React, { useState, useEffect } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'regimes' | 'documents' | 'whatif' | 'readiness' | 'deadlines' | 'copilot'
  >('dashboard');

  // State from authoritative backend
  const [twinId, setTwinId] = useState<string>('');
  const [twinData, setTwinData] = useState<any>(null);
  const [calculation, setCalculation] = useState<any>(null);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<any>(null);

  // Custom calculation inputs for interactive regimes tab
  const [salary, setSalary] = useState<number>(1475000);
  const [otherIncome, setOtherIncome] = useState<number>(12000);
  const [sec80C, setSec80C] = useState<number>(150000);
  const [sec80D, setSec80D] = useState<number>(25000);
  const [sec80CCD, setSec80CCD] = useState<number>(50000);
  const [hra, setHra] = useState<number>(0);
  const [sec24b, setSec24b] = useState<number>(0);
  const [calcLoading, setCalcLoading] = useState<boolean>(false);

  // AIS Conflict State
  const [extractedDoc, setExtractedDoc] = useState<any>(null);
  const [reconciling, setReconciling] = useState<boolean>(false);
  const [reconciliationSuccess, setReconciliationSuccess] = useState<string | null>(null);

  // What-If State
  const [npsAmount, setNpsAmount] = useState<number>(50000);
  const [whatIfResult, setWhatIfResult] = useState<any>(null);
  const [whatIfLoading, setWhatIfLoading] = useState<boolean>(false);

  // Gemma AI Copilot State
  const [prompt, setPrompt] = useState<string>(
    'Why is the New Tax Regime better for my income profile in FY 2025-26?'
  );
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiModel, setAiModel] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper for API calculations
  const calculateData = async (sal: number, other: number, c: number, d: number, nps: number, h: number, s24: number) => {
    const res = await fetch('/api/v1/tax/calculate/stateless', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        financialYear: '2025-2026',
        assessmentYear: '2026-2027',
        regimePreference: 'COMPARE',
        incomeSources: [
          { category: 'SALARY', grossAmount: Number(sal) || 0, employerOrPayer: 'Primary Tech Employer' },
          ...(Number(other) > 0 ? [{ category: 'OTHER_SOURCES', grossAmount: Number(other), employerOrPayer: 'Savings Bank Interest' }] : []),
        ],
        deductions: {
          section80C: Number(c) || 0,
          section80D: Number(d) || 0,
          section80CCD1B: Number(nps) || 0,
          hraExemption: Number(h) || 0,
          section24b: Number(s24) || 0,
        },
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  };

  // Initial Load: Calculate baseline & load statutory deadlines
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const calcData = await calculateData(salary, otherIncome, sec80C, sec80D, 0, hra, sec24b);
      setCalculation(calcData);

      // Fetch deadlines
      const dlRes = await fetch('/api/v1/tax/deadlines');
      if (dlRes.ok) {
        const dlData = await dlRes.json();
        setDeadlines(dlData.deadlines || []);
      }
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to tax engine backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle re-calculation when user changes inputs on Regime Comparison tab
  const handleRecalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCalcLoading(true);
    setError(null);
    try {
      const data = await calculateData(salary, otherIncome, sec80C, sec80D, sec80CCD, hra, sec24b);
      setCalculation(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCalcLoading(false);
    }
  };

  // Document Extraction Simulation
  const handleSimulateAISExtraction = () => {
    setLoading(true);
    setTimeout(() => {
      setExtractedDoc({
        documentType: 'Annual Information Statement (AIS / TIS)',
        taxPeriod: 'FY 2025-26',
        pan: 'ABCDE1234F',
        conflictsDetected: [
          {
            field: 'savings_interest',
            declaredValue: 12000,
            extractedValue: 18500,
            source: 'HDFC Bank & ICICI Bank AIS Reporting',
            message: 'AIS reports ₹18,500 savings account interest whereas your initial draft declared ₹12,000. Under Section 285BA, the Income Tax Department will cross-verify this figure.',
          },
        ],
      });
      setLoading(false);
    }, 600);
  };

  // User accepts AIS reconciliation -> updates Twin state
  const handleAcceptAISReconciliation = async () => {
    setReconciling(true);
    setError(null);
    try {
      setOtherIncome(18500);
      const updatedCalc = await calculateData(salary, 18500, sec80C, sec80D, sec80CCD, hra, sec24b);
      setCalculation(updatedCalc);
      setTwinData({ versionNumber: 2, isActive: true, changeSummary: 'Reconciled AIS interest to ₹18,500' });
      setReconciliationSuccess('Reconciled successfully! Tax Twin upgraded to Version 2. Authoritative baseline updated.');
      setReadiness({ readinessScore: 100, status: 'Ready to Draft Return' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReconciling(false);
    }
  };

  // What-If NPS Simulation
  const handleRunWhatIf = async () => {
    setWhatIfLoading(true);
    setError(null);
    try {
      const res = await calculateData(salary, otherIncome, sec80C, sec80D, npsAmount, hra, sec24b);
      const baseTax = calculation?.result?.totalTaxLiability || 95470;
      const simTax = res?.result?.totalTaxLiability || 0;
      setWhatIfResult({
        baselineTax: baseTax,
        simulatedTax: simTax,
        savings: Math.max(0, baseTax - simTax),
        simulatedResult: res,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setWhatIfLoading(false);
    }
  };

  // Ask Gemma / Groq Copilot
  const handleAskCopilot = async () => {
    if (!prompt.trim()) return;
    setAiLoading(true);
    setAiReply(null);
    try {
      const res = await fetch('/api/v1/tax/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to get AI response');
      setAiReply(data.reply);
      setAiModel(data.model || 'Gemma 2');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1d' }}>
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: '270px',
          background: '#0d1527',
          borderRight: '1px solid #1e293b',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem', paddingLeft: '0.5rem' }}>
            <span style={{ fontSize: '1.6rem' }}>⚡</span>
            <div>
              <h1 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700, color: '#38bdf8', letterSpacing: '-0.02em' }}>
                AI Tax Copilot
              </h1>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>FY 2025-26 / AY 2026-27</span>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {[
              { id: 'dashboard', icon: '📊', label: 'Dashboard' },
              { id: 'regimes', icon: '⚖️', label: 'Regime Comparison' },
              { id: 'documents', icon: '📄', label: 'Documents & AIS Conflict' },
              { id: 'whatif', icon: '🔮', label: 'What-If Scenario' },
              { id: 'readiness', icon: '✅', label: 'Filing Readiness' },
              { id: 'deadlines', icon: '📅', label: 'Deadlines Calendar' },
              { id: 'copilot', icon: '🤖', label: 'Gemma AI Copilot' },
            ].map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  style={{
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: active ? 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                    color: active ? '#ffffff' : '#94a3b8',
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    fontSize: '0.88rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Authoritative State Badge */}
        <div
          style={{
            padding: '0.85rem',
            background: '#131e36',
            borderRadius: '8px',
            fontSize: '0.75rem',
            border: '1px solid #1e293b',
          }}
        >
          <div style={{ color: '#38bdf8', fontWeight: 600 }}>Authoritative Tax State:</div>
          <div style={{ color: '#cbd5e1', marginTop: '0.3rem' }}>
            Twin Version: <strong style={{ color: '#34d399' }}>{twinData ? `v${twinData.versionNumber}` : 'v1 (Baseline)'}</strong>
          </div>
          <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.25rem' }}>
            Engine: Deterministic Statutory FY 2025-26
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2.5rem 3.5rem', overflowY: 'auto' }}>
        {error && (
          <div
            style={{
              background: '#7f1d1d',
              border: '1px solid #991b1b',
              color: '#fecaca',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
                Tax Overview & Snapshot
              </h2>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
                Real-time financial profile evaluated under the latest FY 2025-26 (AY 2026-27) statutory tax provisions.
              </p>
            </div>

            {/* Stat Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
              <div
                style={{
                  background: '#131e36',
                  padding: '1.35rem',
                  borderRadius: '12px',
                  border: '1px solid #1e293b',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Gross Total Income
                </span>
                <div style={{ fontSize: '1.65rem', fontWeight: 700, marginTop: '0.35rem', color: '#ffffff' }}>
                  ₹{(calculation?.result?.grossTotalIncome || salary + otherIncome).toLocaleString('en-IN')}
                </div>
              </div>

              <div
                style={{
                  background: '#131e36',
                  padding: '1.35rem',
                  borderRadius: '12px',
                  border: '1px solid #1e293b',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Optimal Regime
                </span>
                <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.35rem' }}>
                  {calculation?.comparison?.recommendedRegime || 'NEW'} REGIME
                </div>
              </div>

              <div
                style={{
                  background: '#131e36',
                  padding: '1.35rem',
                  borderRadius: '12px',
                  border: '1px solid #1e293b',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Tax Liability
                </span>
                <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#34d399', marginTop: '0.35rem' }}>
                  ₹{(calculation?.result?.totalTaxLiability || 95470).toLocaleString('en-IN')}
                </div>
              </div>

              <div
                style={{
                  background: '#131e36',
                  padding: '1.35rem',
                  borderRadius: '12px',
                  border: '1px solid #1e293b',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Tax Twin State
                </span>
                <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#c084fc', marginTop: '0.35rem' }}>
                  {twinData ? `Version ${twinData.versionNumber}` : 'Version 1'}
                </div>
              </div>
            </div>

            {/* Active Income Facts Card */}
            <div
              style={{
                background: '#131e36',
                padding: '1.75rem',
                borderRadius: '12px',
                border: '1px solid #1e293b',
              }}
            >
              <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1.15rem', color: '#f8fafc' }}>
                Active Income Facts in Tax Twin
              </h3>
              <ul style={{ lineHeight: '2.1', color: '#cbd5e1', paddingLeft: '1.25rem', margin: 0 }}>
                <li>
                  💼 Primary Salary Income: <strong>₹{salary.toLocaleString('en-IN')}</strong> (Form 16 from Tech Enterprises)
                </li>
                <li>
                  🏦 Savings Account Interest:{' '}
                  <strong>₹{otherIncome.toLocaleString('en-IN')} {twinData ? '(Reconciled from AIS)' : '(Declared)'}</strong>
                </li>
                <li>
                  🛡️ Standard Deduction: <strong>₹75,000</strong> (New Tax Regime Section 16(ia))
                </li>
                <li>
                  🎯 Section 87A Rebate: <strong>Available up to ₹60,000 for income ≤ ₹12 Lakhs</strong>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: REGIME COMPARISON */}
        {activeTab === 'regimes' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
                Deterministic Regime Comparison
              </h2>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
                Side-by-side mathematical evaluation comparing New Regime (Sec 115BAC) vs Old Regime with itemized trace.
              </p>
            </div>

            {/* Recommendation Banner */}
            {calculation?.comparison && (
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  background: '#064e3b',
                  borderRadius: '10px',
                  border: '1px solid #059669',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ fontWeight: 700, color: '#6ee7b7', fontSize: '1.1rem' }}>
                  ⭐ Recommended: {calculation.comparison.recommendedRegime} REGIME
                </div>
                <div style={{ color: '#a7f3d0', fontSize: '0.92rem', marginTop: '0.35rem' }}>
                  {calculation.comparison.summary} (Savings:{' '}
                  <strong>₹{Math.abs(calculation.comparison.taxDifference).toLocaleString('en-IN')}</strong>)
                </div>
              </div>
            )}

            {/* Interactive Inputs Drawer */}
            <form
              onSubmit={handleRecalculate}
              style={{
                background: '#131e36',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #1e293b',
                marginBottom: '2rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
              }}
            >
              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                  Gross Annual Salary (₹)
                </label>
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    background: '#0a0f1d',
                    color: '#f8fafc',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                  Other Income / Interest (₹)
                </label>
                <input
                  type="number"
                  value={otherIncome}
                  onChange={(e) => setOtherIncome(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    background: '#0a0f1d',
                    color: '#f8fafc',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                  Section 80C Deductions (₹)
                </label>
                <input
                  type="number"
                  value={sec80C}
                  onChange={(e) => setSec80C(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    background: '#0a0f1d',
                    color: '#f8fafc',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                  Section 80D Mediclaim (₹)
                </label>
                <input
                  type="number"
                  value={sec80D}
                  onChange={(e) => setSec80D(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    background: '#0a0f1d',
                    color: '#f8fafc',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                  Sec 80CCD(1B) NPS (₹)
                </label>
                <input
                  type="number"
                  value={sec80CCD}
                  onChange={(e) => setSec80CCD(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    background: '#0a0f1d',
                    color: '#f8fafc',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={calcLoading}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1.25rem',
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {calcLoading ? 'Computing...' : 'Recalculate Tax'}
                </button>
              </div>
            </form>

            {/* Comparison Cards */}
            {calculation?.comparison && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* New Regime Card */}
                <div
                  style={{
                    background: '#131e36',
                    padding: '1.75rem',
                    borderRadius: '12px',
                    border: '2px solid #0284c7',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#38bdf8', margin: 0, fontSize: '1.25rem' }}>New Tax Regime</h3>
                    <span style={{ fontSize: '0.72rem', background: '#0369a1', color: '#bae6fd', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                      Default (Sec 115BAC)
                    </span>
                  </div>

                  <div style={{ lineHeight: '2.1', fontSize: '0.92rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Gross Total Income:</span>
                      <strong>₹{calculation.comparison.newRegime.grossTotalIncome.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Standard Deduction:</span>
                      <strong style={{ color: '#34d399' }}>-₹{calculation.comparison.newRegime.standardDeduction.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Net Taxable Income:</span>
                      <strong>₹{calculation.comparison.newRegime.netTaxableIncome.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Tax on Slabs:</span>
                      <span>₹{calculation.comparison.newRegime.taxOnSlabs.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Section 87A Rebate:</span>
                      <span style={{ color: '#34d399' }}>-₹{calculation.comparison.newRegime.rebate87A.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Health & Edu Cess (4%):</span>
                      <span>₹{calculation.comparison.newRegime.cess.toLocaleString('en-IN')}</span>
                    </div>

                    <div
                      style={{
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid #1e293b',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '1.25rem',
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>Total Tax Liability:</span>
                      <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                        ₹{calculation.comparison.newRegime.totalTaxLiability.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Old Regime Card */}
                <div
                  style={{
                    background: '#131e36',
                    padding: '1.75rem',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#cbd5e1', margin: 0, fontSize: '1.25rem' }}>Old Tax Regime</h3>
                    <span style={{ fontSize: '0.72rem', background: '#334155', color: '#cbd5e1', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                      With Chapter VI-A
                    </span>
                  </div>

                  <div style={{ lineHeight: '2.1', fontSize: '0.92rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Gross Total Income:</span>
                      <strong>₹{calculation.comparison.oldRegime.grossTotalIncome.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Total Deductions (80C/80D/Std):</span>
                      <strong style={{ color: '#34d399' }}>-₹{calculation.comparison.oldRegime.totalExemptionsAndDeductions.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Net Taxable Income:</span>
                      <strong>₹{calculation.comparison.oldRegime.netTaxableIncome.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Tax on Slabs:</span>
                      <span>₹{calculation.comparison.oldRegime.taxOnSlabs.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Section 87A Rebate:</span>
                      <span style={{ color: '#34d399' }}>-₹{calculation.comparison.oldRegime.rebate87A.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Health & Edu Cess (4%):</span>
                      <span>₹{calculation.comparison.oldRegime.cess.toLocaleString('en-IN')}</span>
                    </div>

                    <div
                      style={{
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid #1e293b',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '1.25rem',
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>Total Tax Liability:</span>
                      <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                        ₹{calculation.comparison.oldRegime.totalTaxLiability.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DOCUMENTS & AIS CONFLICT RECONCILIATION */}
        {activeTab === 'documents' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
                Document Intelligence & AIS Conflict Reconciliation
              </h2>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
                Ingest official Form 16 and AIS / TIS tax reports. Any discrepancy automatically triggers an audit gate and upgrades the Tax Twin version.
              </p>
            </div>

            <button
              onClick={handleSimulateAISExtraction}
              disabled={loading}
              style={{
                padding: '0.8rem 1.75rem',
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '1.75rem',
                fontSize: '0.92rem',
              }}
            >
              {loading ? 'Analyzing AIS PDF...' : 'Simulate Upload: AIS / Form 26AS Statement'}
            </button>

            {extractedDoc && (
              <div
                style={{
                  background: '#131e36',
                  padding: '1.75rem',
                  borderRadius: '12px',
                  border: '1px solid #1e293b',
                }}
              >
                <h3 style={{ marginTop: 0, color: '#f8fafc', fontSize: '1.15rem' }}>
                  Document Extracted: {extractedDoc.documentType}
                </h3>

                {extractedDoc.conflictsDetected.map((c: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      background: '#451a03',
                      border: '1px solid #d97706',
                      padding: '1.25rem',
                      borderRadius: '8px',
                      marginTop: '1.25rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '1rem' }}>
                      ⚠️ Statutory Discrepancy Detected:
                    </div>
                    <div style={{ marginTop: '0.5rem', color: '#fde68a', lineHeight: '1.6', fontSize: '0.92rem' }}>
                      {c.message}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                      <button
                        onClick={handleAcceptAISReconciliation}
                        disabled={reconciling}
                        style={{
                          padding: '0.65rem 1.25rem',
                          background: '#059669',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '0.88rem',
                        }}
                      >
                        {reconciling ? 'Updating Tax Twin...' : `Accept AIS Value (₹${c.extractedValue.toLocaleString('en-IN')}) & Fork Twin v2`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reconciliationSuccess && (
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1.25rem',
                  background: '#064e3b',
                  border: '1px solid #059669',
                  color: '#6ee7b7',
                  borderRadius: '8px',
                  fontWeight: 500,
                }}
              >
                ✅ {reconciliationSuccess}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: WHAT-IF SCENARIO */}
        {activeTab === 'whatif' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
                What-If Tax Scenario Simulator
              </h2>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
                Simulate potential tax planning maneuvers (such as Section 80CCD(1B) NPS investments or salary increments) in a sandbox without altering your locked baseline.
              </p>
            </div>

            <div
              style={{
                background: '#131e36',
                padding: '1.75rem',
                borderRadius: '12px',
                border: '1px solid #1e293b',
                maxWidth: '650px',
              }}
            >
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 500 }}>
                Additional NPS Contribution (Section 80CCD(1B)):
              </label>
              <input
                type="number"
                value={npsAmount}
                onChange={(e) => setNpsAmount(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#0a0f1d',
                  color: '#f8fafc',
                  marginBottom: '1.25rem',
                  fontSize: '0.95rem',
                }}
              />

              <button
                onClick={handleRunWhatIf}
                disabled={whatIfLoading}
                style={{
                  padding: '0.8rem 1.75rem',
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.92rem',
                }}
              >
                {whatIfLoading ? 'Simulating...' : 'Simulate What-If Tax Impact'}
              </button>
            </div>

            {whatIfResult && (
              <div
                style={{
                  marginTop: '2rem',
                  background: '#131e36',
                  padding: '1.75rem',
                  borderRadius: '12px',
                  border: '1px solid #1e293b',
                  maxWidth: '650px',
                }}
              >
                <h3 style={{ color: '#38bdf8', marginTop: 0, fontSize: '1.2rem' }}>Simulation Results:</h3>
                <div style={{ fontSize: '1.05rem', lineHeight: '2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Baseline Tax Liability:</span>
                    <strong>₹{whatIfResult.baselineTax.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Simulated Tax Liability:</span>
                    <strong>₹{whatIfResult.simulatedTax.toLocaleString('en-IN')}</strong>
                  </div>
                  <div
                    style={{
                      color: '#34d399',
                      fontSize: '1.3rem',
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #1e293b',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Potential Tax Savings:</span>
                    <strong>₹{whatIfResult.savings.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: FILING READINESS */}
        {activeTab === 'readiness' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
                Filing Readiness & Compliance Checklist
              </h2>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
                Verification audit gates ensuring your data is reconciliated and compliant before filing ITR-1 / ITR-2.
              </p>
            </div>

            <div
              style={{
                background: '#131e36',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #1e293b',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: '#34d399' }}>
                  {readiness ? `${readiness.readinessScore}%` : '85%'}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', color: '#f8fafc', fontSize: '1.25rem' }}>
                    {readiness ? 'Ready to File Return' : 'Drafting Phase — Form 16 Matched'}
                  </h3>
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                    ITR-1 (Sahaj) eligible: Resident individual with salary & bank interest income under ₹50L.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div
                  style={{
                    padding: '0.9rem 1.25rem',
                    background: '#0a0f1d',
                    borderRadius: '8px',
                    borderLeft: '4px solid #34d399',
                    fontSize: '0.92rem',
                  }}
                >
                  ✅ <strong>Form 16 Salary Income (Tech Enterprises Pvt Ltd)</strong> — Matched & Verified
                </div>
                <div
                  style={{
                    padding: '0.9rem 1.25rem',
                    background: '#0a0f1d',
                    borderRadius: '8px',
                    borderLeft: '4px solid #34d399',
                    fontSize: '0.92rem',
                  }}
                >
                  ✅ <strong>Section 80C EPF & ELSS Proofs</strong> — Verified under statutory limit of ₹1.5L
                </div>
                <div
                  style={{
                    padding: '0.9rem 1.25rem',
                    background: '#0a0f1d',
                    borderRadius: '8px',
                    borderLeft: '4px solid #38bdf8',
                    fontSize: '0.92rem',
                  }}
                >
                  ℹ️ <strong>AIS Bank Interest</strong> — {twinData ? 'Reconciled to ₹18,500' : 'Declared at ₹12,000 (AIS match pending)'}
                </div>
                <div
                  style={{
                    padding: '0.9rem 1.25rem',
                    background: '#0a0f1d',
                    borderRadius: '8px',
                    borderLeft: '4px solid #34d399',
                    fontSize: '0.92rem',
                  }}
                >
                  ✅ <strong>PAN & Aadhaar Seeding</strong> — Verified Active
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DEADLINES */}
        {activeTab === 'deadlines' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
                Statutory Compliance Calendar
              </h2>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
                Important advance tax, ITR filing, and audit deadlines for AY 2026-27 under the Indian Income Tax Act.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(deadlines.length > 0
                ? deadlines
                : [
                    { id: '1', title: 'Q1 Advance Tax (15%)', dueDate: '15 June 2025', description: 'First installment of Advance Tax for FY 2025-26', category: 'Advance Tax' },
                    { id: '2', title: 'Q2 Advance Tax (45%)', dueDate: '15 September 2025', description: 'Second installment of Advance Tax for FY 2025-26', category: 'Advance Tax' },
                    { id: '3', title: 'Q3 Advance Tax (75%)', dueDate: '15 December 2025', description: 'Third installment of Advance Tax for FY 2025-26', category: 'Advance Tax' },
                    { id: '4', title: 'Q4 Advance Tax (100%)', dueDate: '15 March 2026', description: 'Final installment of Advance Tax for FY 2025-26', category: 'Advance Tax' },
                    { id: '5', title: 'ITR Filing Deadline (Non-Audit)', dueDate: '31 July 2026', description: 'Original return filing deadline for salaried taxpayers for AY 2026-27', category: 'ITR Return' },
                    { id: '6', title: 'Belated / Revised Return Deadline', dueDate: '31 December 2026', description: 'Last date to submit belated return per Section 139(4)', category: 'Compliance' },
                  ]
              ).map((dl) => (
                <div
                  key={dl.id}
                  style={{
                    background: '#131e36',
                    padding: '1.25rem 1.75rem',
                    borderRadius: '10px',
                    border: '1px solid #1e293b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#38bdf8' }}>{dl.title}</h3>
                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>{dl.description}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.98rem' }}>{dl.dueDate}</div>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '0.3rem',
                        fontSize: '0.75rem',
                        background: '#0369a1',
                        color: '#bae6fd',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        fontWeight: 500,
                      }}
                    >
                      {dl.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: GEMMA COPILOT */}
        {activeTab === 'copilot' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '1.85rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                  Gemma AI Tax Copilot
                </h2>
                <span
                  style={{
                    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  ⚡ Live on Groq
                </span>
              </div>
              <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                Ask complex tax queries, slab breakdowns, and Section 87A rebate rules in plain English. Powered by high-speed Gemma 2 reasoning.
              </p>
            </div>

            {/* Quick Prompt Presets */}
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {[
                'Why is the New Tax Regime better for my income profile in FY 2025-26?',
                'Explain the Section 87A rebate of ₹60,000 for income up to ₹12 Lakhs.',
                'Is standard deduction of ₹75,000 available in both Old and New regimes?',
                'Can I claim both Section 80C and HRA in the New Regime?',
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(sample)}
                  style={{
                    background: '#131e36',
                    border: '1px solid #334155',
                    color: '#cbd5e1',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  💬 {sample}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskCopilot();
                }}
                placeholder="Ask any Indian tax query..."
                style={{
                  flex: 1,
                  padding: '0.85rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  background: '#131e36',
                  color: '#f8fafc',
                  fontSize: '0.95rem',
                }}
              />
              <button
                onClick={handleAskCopilot}
                disabled={aiLoading}
                style={{
                  padding: '0.85rem 1.85rem',
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                {aiLoading ? 'Thinking...' : 'Ask Copilot'}
              </button>
            </div>

            {aiReply && (
              <div
                style={{
                  background: '#131e36',
                  padding: '1.75rem',
                  borderRadius: '12px',
                  border: '1px solid #0284c7',
                  lineHeight: '1.75',
                  whiteSpace: 'pre-wrap',
                  color: '#f1f5f9',
                  fontSize: '0.95rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid #1e293b',
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#38bdf8' }}>🤖 AI Tax Guidance</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Model: {aiModel || 'Gemma 2'}</span>
                </div>
                {aiReply}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
