import { jsonResponse, errorResponse, handleCORS } from './utils';
import { getOrRunAnalysis } from './data/services/analysisService';
import { logApiUsage } from './data/repositories/cacheRepository';

const NIM_BASE = 'https://integrate.api.nvidia.com/v1';

interface AnalyzeRequest {
  fixture: {
    id: number;
    home: string;
    away: string;
    league: string;
    status: string;
    minute?: number;
    score?: { home: number; away: number };
  };
  statistics?: Record<string, number | null>;
  odds?: unknown[];
  h2h?: unknown[];
  profile: 'conservative' | 'balanced' | 'aggressive';
  reasoning: 'fast' | 'high' | 'maximum';
  dataQuality?: string;
  missingData?: string[];
}

interface AnalysisEntry {
  market: string;
  line: string;
  currentOdd: number;
  estimatedProbability: number;
  fairOdd: number;
  minimumOdd: number;
  edge: number;
  risk: 'low' | 'moderate' | 'high';
  confidence: number;
  decision: 'ENTER' | 'WATCH' | 'NO_BET';
  explanation: string;
}

interface AnalysisResponse {
  entries: AnalysisEntry[];
  model: string;
  analyzedAt: string;
  fixtureId: number;
  fromCache: boolean;
}

function buildPrompt(data: AnalyzeRequest): string {
  const isLive = data.fixture.status !== 'NS';
  const statusContext = isLive
    ? `LIVE MATCH - Minute ${data.fixture.minute || 0}, Score: ${data.fixture.score?.home ?? '?'}-${data.fixture.score?.away ?? '?'}`
    : 'PRE-MATCH';

  const missingDataStr = data.missingData?.length
    ? `\nMISSING DATA (do NOT assume these are zero): ${data.missingData.join(', ')}`
    : '';

  const statsStr = data.statistics
    ? Object.entries(data.statistics)
        .map(([k, v]) => `  ${k}: ${v != null ? v : 'N/A'}`)
        .join('\n')
    : '  No statistics available';

  return `You are a professional football betting analyst. Analyze this match and find value opportunities.

MATCH: ${data.fixture.home} vs ${data.fixture.away}
League: ${data.fixture.league}
Status: ${statusContext}
Data Quality: ${data.dataQuality || 'UNKNOWN'}
${missingDataStr}

STATISTICS (null = not available, NOT zero):
${statsStr}

ODDS AVAILABLE:
${JSON.stringify(data.odds || [], null, 2)}

H2H (last 5):
${JSON.stringify(data.h2h || [], null, 2)}

ANALYSIS PROFILE: ${data.profile}
REASONING LEVEL: ${data.reasoning}

CRITICAL RULES:
1. NEVER assume null/missing data means zero. A missing stat is NOT zero.
2. NEVER fabricate statistics that are not provided.
3. NEVER fabricate odds. Only use VERIFIABLE current odds from the data.
4. If a stat is null/missing, acknowledge it as unknown in your analysis.
5. Only recommend ENTER if edge > 5% AND you have a verifiable odd.
6. Without a verifiable odd, decision MUST be NO_BET.
7. Reduce confidence when data quality is PARTIAL or SCORE_ONLY.
8. Maximum 3 opportunities. If no good opportunity, return NO_BET for all.

Return a JSON array of analysis entries. Each entry must have:
- market: string
- line: string
- currentOdd: number
- estimatedProbability: number (0-1)
- fairOdd: number
- minimumOdd: number (fair odd * 1.05)
- edge: number (percentage)
- risk: "low" | "moderate" | "high"
- confidence: number (0-100)
- decision: "ENTER" | "WATCH" | "NO_BET"
- explanation: string (brief reasoning)

Return ONLY the JSON array, no other text.`;
}

function getReasoningEffort(reasoning: string): string {
  switch (reasoning) {
    case 'fast': return 'low';
    case 'high': return 'high';
    case 'maximum': return 'max';
    default: return 'low';
  }
}

async function callKimi(payload: Record<string, unknown>, apiKey: string): Promise<string> {
  const nimResponse = await fetch(`${NIM_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (nimResponse.status === 200) {
    const nimData = await nimResponse.json();
    const content = nimData.choices?.[0]?.message?.content;
    if (!content) throw new Error('No response from AI');
    return content;
  }

  if (nimResponse.status === 202) {
    const asyncData = await nimResponse.json();
    const requestId = asyncData.id || asyncData.request_id;
    if (!requestId) throw new Error('No requestId in 202 response');

    const MAX_POLL = 15;
    const POLL_MS = 2000;

    for (let i = 0; i < MAX_POLL; i++) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      const statusResponse = await fetch(`${NIM_BASE}/status/${requestId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (statusResponse.status === 200) {
        const statusData = await statusResponse.json();
        const content = statusData.choices?.[0]?.message?.content;
        if (!content) throw new Error('No content in completed status');
        return content;
      }

      if (statusResponse.status === 422) throw new Error('AI processing failed (422)');
      if (statusResponse.status === 500) throw new Error('AI server error (500)');
    }

    throw new Error('AI analysis timed out');
  }

  const errorText = await nimResponse.text();
  throw new Error(`AI analysis failed (${nimResponse.status}): ${errorText}`);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return handleCORS();
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return errorResponse('NVIDIA_API_KEY not configured', 500);
  }

  let body: AnalyzeRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  if (!body.fixture?.id || !body.fixture?.home || !body.fixture?.away) {
    return errorResponse('Missing required fixture data', 400);
  }

  try {
    const startTime = Date.now();

    // Use analysis cache (input hash deduplication)
    const { result, fromCache } = await getOrRunAnalysis(
      {
        fixtureId: body.fixture.id,
        home: body.fixture.home,
        away: body.fixture.away,
        league: body.fixture.league,
        status: body.fixture.status,
        minute: body.fixture.minute,
        score: body.fixture.score,
        statistics: body.statistics,
        odds: body.odds,
        h2h: body.h2h,
        profile: body.profile,
        reasoning: body.reasoning,
        dataQuality: body.dataQuality,
        missingData: body.missingData,
      },
      async (input) => {
        const prompt = buildPrompt(body);
        const payload = {
          model: 'moonshotai/kimi-k3',
          messages: [
            { role: 'system', content: 'You are a precise football betting analyst. Always respond with valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          temperature: 1.0,
          max_tokens: 4096,
          reasoning_effort: getReasoningEffort(input.reasoning),
        };

        const content = await callKimi(payload, apiKey);

        // Parse response
        let entries: AnalysisEntry[];
        try {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          entries = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
        } catch {
          throw new Error('Failed to parse AI response');
        }

        return entries
          .filter((e) => e && typeof e.market === 'string' && typeof e.currentOdd === 'number')
          .slice(0, 3)
          .map((e) => ({
            ...e,
            estimatedProbability: Math.min(1, Math.max(0, e.estimatedProbability || 0)),
            edge: Math.round((e.edge || 0) * 10) / 10,
            confidence: Math.min(100, Math.max(0, e.confidence || 0)),
            decision: ['ENTER', 'WATCH', 'NO_BET'].includes(e.decision) ? e.decision : 'NO_BET',
            risk: ['low', 'moderate', 'high'].includes(e.risk) ? e.risk : 'moderate',
          }));
      },
    );

    const durationMs = Date.now() - startTime;

    // Log usage
    await logApiUsage({
      provider: 'nvidia',
      endpoint: 'kimi-k3',
      requestKey: `analysis:${body.fixture.id}`,
      cacheHit: fromCache,
      durationMs,
    });

    const response: AnalysisResponse = {
      entries: result as AnalysisEntry[],
      model: 'moonshotai/kimi-k3',
      analyzedAt: new Date().toISOString(),
      fixtureId: body.fixture.id,
      fromCache,
    };

    return jsonResponse(response);
  } catch (error) {
    console.error('Analysis error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Analysis failed', 500);
  }
}
