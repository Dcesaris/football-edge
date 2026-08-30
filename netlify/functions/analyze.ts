import { jsonResponse, errorResponse, handleCORS } from './utils';

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
    const prompt = buildPrompt(body);
    const payload = {
      model: 'moonshotai/kimi-k3',
      messages: [
        {
          role: 'system',
          content: 'You are a precise football betting analyst. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 1.0,
      max_tokens: 4096,
      reasoning_effort: getReasoningEffort(body.reasoning),
    };

    // Step 1: Send initial request
    const nimResponse = await fetch(`${NIM_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    // Handle immediate 200 response
    if (nimResponse.status === 200) {
      const nimData = await nimResponse.json();
      const content = nimData.choices?.[0]?.message?.content;
      if (!content) {
        return errorResponse('No response from AI', 502);
      }
      return parseAndReturn(content, body.fixture.id);
    }

    // Handle 202 Accepted (async processing)
    if (nimResponse.status === 202) {
      const asyncData = await nimResponse.json();
      const requestId = asyncData.id || asyncData.request_id;
      if (!requestId) {
        return errorResponse('No requestId in 202 response', 502);
      }

      // Poll status endpoint with controlled timeout
      const MAX_POLL_ATTEMPTS = 15;
      const POLL_INTERVAL_MS = 2000;

      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

        const statusResponse = await fetch(`${NIM_BASE}/status/${requestId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (statusResponse.status === 200) {
          const statusData = await statusResponse.json();
          const content = statusData.choices?.[0]?.message?.content;
          if (!content) {
            return errorResponse('No content in completed status', 502);
          }
          return parseAndReturn(content, body.fixture.id);
        }

        if (statusResponse.status === 422) {
          const errText = await statusResponse.text();
          console.error('NIM status 422:', errText);
          return errorResponse('AI processing failed (422)', 502);
        }

        if (statusResponse.status === 500) {
          return errorResponse('AI server error (500)', 502);
        }

        // 202 = still processing, continue polling
      }

      // Timeout exceeded
      return errorResponse('AI analysis timed out. Try again later.', 504);
    }

    // Handle other error codes
    const errorText = await nimResponse.text();
    console.error('NIM API error:', nimResponse.status, errorText);
    return errorResponse(`AI analysis failed (${nimResponse.status})`, 502);
  } catch (error) {
    console.error('Analysis error:', error);
    return errorResponse('Analysis failed', 500);
  }
}

function parseAndReturn(content: string, fixtureId: number): Response {
  let entries: AnalysisEntry[];
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      entries = JSON.parse(jsonMatch[0]);
    } else {
      entries = JSON.parse(content);
    }
  } catch {
    return errorResponse('Failed to parse AI response', 502);
  }

  const validEntries = entries
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

  const response: AnalysisResponse = {
    entries: validEntries,
    model: 'moonshotai/kimi-k3',
    analyzedAt: new Date().toISOString(),
    fixtureId,
  };

  return jsonResponse(response);
}
