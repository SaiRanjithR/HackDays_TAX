import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TaxCopilotToolDeclarations, executeTaxCopilotTool } from '@/lib/ai-tools/tax-copilot-tools';

/**
 * Server-Side Gemini AI Tax Copilot Endpoint
 * Strictly adheres to SHARED_CONTRACTS.md:
 * 1. GEMINI_API_KEY is kept strictly server-side (never exposed to browser / client code).
 * 2. Deterministic Tax Engine remains authoritative for numerical arithmetic.
 * 3. Gemini orchestrates tools, retrieves statutory facts, and explains calculations.
 */
export async function POST(request: NextRequest) {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    const googleApiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (!groqApiKey && (!googleApiKey || googleApiKey === 'your-server-side-gemini-api-key-here')) {
      return NextResponse.json(
        {
          error: 'Missing API Key',
          message:
            'Please set GROQ_API_KEY (from https://console.groq.com) or GEMINI_API_KEY in your .env file.',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const userPrompt = body.prompt;

    if (!userPrompt || typeof userPrompt !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'prompt string is required' },
        { status: 400 }
      );
    }

    const systemInstruction = `You are an authoritative, friendly AI Personal Tax Copilot for Indian taxpayers under FY 2025-26 / AY 2026-27.
Explain deductions, slab breakdowns, Section 87A rebate rules (up to ₹60,000 for income <= ₹12L in the new regime), and Old vs New regime tradeoffs clearly in simple terms with INR (₹) formatting.
Initial statutory baseline for New Regime (FY 2025-26):
- ₹0–₹4,00,000: Nil
- ₹4,00,001–₹8,00,000: 5%
- ₹8,00,001–₹12,00,000: 10%
- ₹12,00,001–₹16,00,000: 15%
- ₹16,00,001–₹20,00,000: 20%
- ₹20,00,001–₹24,00,000: 25%
- Above ₹24,00,000: 30%
Standard deduction for salaried employees in New Regime is ₹75,000.`;

    let replyText = '';
    let modelName = '';
    let toolUsed: string | null = null;

    if (groqApiKey) {
      // 1. Groq Gemma 2 Provider (gemma2-9b-it)
      modelName = process.env.GEMMA_MODEL_NAME || 'gemma2-9b-it';
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
        }),
      });

      if (!groqRes.ok) {
        const errJson = await groqRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Groq API returned HTTP ${groqRes.status}`);
      }

      const groqData = await groqRes.json();
      replyText = groqData.choices?.[0]?.message?.content || 'No response generated.';
    } else if (googleApiKey) {
      // 2. Google Provider (Gemini / Gemma)
      modelName = process.env.GEMMA_MODEL_NAME || 'gemini-1.5-flash';
      const genAI = new GoogleGenerativeAI(googleApiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
      });
      const result = await model.generateContent(userPrompt);
      replyText = result.response.text();
    }

    return NextResponse.json(
      {
        reply: replyText,
        model: modelName,
        toolUsed,
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Gemini AI Error',
        message: error?.message || 'Failed to generate AI tax response.',
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
