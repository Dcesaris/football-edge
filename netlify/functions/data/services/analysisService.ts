import { buildInputHash } from '../providers/apiFootball';
import { getAnalysisByHash, insertAnalysis } from '../repositories/analysisRepository';

interface AnalysisInput {
  fixtureId: number;
  home: string;
  away: string;
  league: string;
  status: string;
  minute?: number;
  score?: { home: number; away: number };
  statistics?: Record<string, number | null>;
  odds?: unknown[];
  h2h?: unknown[];
  profile: string;
  reasoning: string;
  dataQuality?: string;
  missingData?: string[];
}

// Canonical key order for deterministic hashing
const CANONICAL_ORDER = [
  'fixtureId', 'home', 'away', 'league', 'status', 'minute',
  'score', 'statistics', 'odds', 'h2h', 'profile', 'reasoning',
  'dataQuality', 'missingData',
];

function canonicalize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(canonicalize);

  const sorted: Record<string, unknown> = {};
  for (const key of CANONICAL_ORDER) {
    if (key in (obj as Record<string, unknown>)) {
      sorted[key] = canonicalize((obj as Record<string, unknown>)[key]);
    }
  }
  // Add any remaining keys in sorted order
  for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
    if (!(key in sorted)) {
      sorted[key] = canonicalize((obj as Record<string, unknown>)[key]);
    }
  }
  return sorted;
}

export async function getOrRunAnalysis(
  input: AnalysisInput,
  runAnalysis: (input: AnalysisInput) => Promise<unknown>,
): Promise<{ result: unknown; fromCache: boolean }> {
  const canonical = canonicalize(input);
  const inputHash = buildInputHash(canonical);

  // 1. Check cache
  try {
    const cached = await getAnalysisByHash(input.fixtureId, 'kimi-k3', inputHash);
    if (cached && cached.result) {
      return { result: cached.result, fromCache: true };
    }
  } catch {
    // DB read failed
  }

  // 2. Run analysis
  const result = await runAnalysis(input);

  // 3. Save to cache
  try {
    await insertAnalysis({
      fixtureId: input.fixtureId,
      model: 'kimi-k3',
      profile: input.profile,
      reasoning: input.reasoning,
      inputHash,
      dataQuality: input.dataQuality,
      missingData: input.missingData,
      result,
    });
  } catch {
    // DB write failed, not critical
  }

  return { result, fromCache: false };
}
