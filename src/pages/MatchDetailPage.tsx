import { useState, useEffect } from 'react';
import { TabType } from '../types';
import { fetchFixtureDetail, fetchFixtureAnalysis, analyzeMatch, type FixtureDetailResponse, type AnalysisResponse } from '../services/api';
import { ArrowLeft, Brain, AlertTriangle } from 'lucide-react';

interface MatchDetailPageProps {
  matchId: string;
  onBack: () => void;
}

const tabs: { key: TabType; label: string }[] = [
  { key: 'overview', label: 'Visão Geral' },
  { key: 'ai', label: 'IA' },
  { key: 'odds', label: 'Odds' },
  { key: 'stats', label: 'Estatísticas' },
  { key: 'players', label: 'Jogadores' },
  { key: 'lineups', label: 'Escalações' },
  { key: 'h2h', label: 'H2H' },
  { key: 'json', label: 'JSON' },
];

const decisionLabels: Record<string, string> = { ENTER: 'ENTRAR', WATCH: 'OBSERVAR', NO_BET: 'SEM ENTRADA' };

export default function MatchDetailPage({ matchId, onBack }: MatchDetailPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [detail, setDetail] = useState<FixtureDetailResponse | null>(null);
  const [analysis, setAnalysis] = useState<FixtureDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fId = parseInt(matchId, 10);
  const isLive = detail?.fixture?.fixture?.status?.short
    ? ['1H', 'HT', '2H', 'ET', 'BT', 'P'].includes(detail.fixture.fixture.status.short)
    : false;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchFixtureDetail(matchId, isLive)
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [matchId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrepareAnalysis = async () => {
    if (analysis) return;
    setAnalysisLoading(true);
    try {
      const data = await fetchFixtureAnalysis(matchId, isLive);
      setAnalysis(data);
    } catch {
      // Analysis not available
    } finally {
      setAnalysisLoading(false);
    }
  };

  const f = detail?.fixture;
  const stats = detail?.statistics;
  const lineups = detail?.lineups;
  const players = detail?.players;
  const h2h = analysis?.h2h;
  const predictions = analysis?.predictions;
  const odds = analysis?.odds;

  const homeName = f?.teams?.home?.name || 'Casa';
  const awayName = f?.teams?.away?.name || 'Fora';
  const homeShort = homeName.split(' ').pop()?.substring(0, 3).toUpperCase() || 'HOM';
  const awayShort = awayName.split(' ').pop()?.substring(0, 3).toUpperCase() || 'AWY';
  const scoreHome = f?.goals?.home;
  const scoreAway = f?.goals?.away;
  const minute = f?.fixture?.status?.elapsed;
  const statusShort = f?.fixture?.status?.short;
  const isLiveMatch = statusShort ? ['1H', 'HT', '2H', 'ET', 'BT', 'P'].includes(statusShort) : false;

  if (loading) {
    return (
      <>
        <div className="match-detail-header">
          <button onClick={onBack} className="back-btn"><ArrowLeft size={16} /><span>Voltar</span></button>
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
        </div>
      </>
    );
  }

  if (error || !f) {
    return (
      <>
        <div className="match-detail-header">
          <button onClick={onBack} className="back-btn"><ArrowLeft size={16} /><span>Voltar</span></button>
          <div className="empty-state">
            <div className="empty-state-title">Erro ao carregar partida</div>
            <div className="empty-state-text">{error || 'Partida não encontrada'}</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="match-detail-header">
        <button onClick={onBack} className="back-btn"><ArrowLeft size={16} /><span>Voltar</span></button>
        <div className="match-detail-competition">
          {f.league?.flag || ''} {f.league?.name}
        </div>
        <div className="match-detail-teams">
          <div className="match-detail-team">
            <div className="team-shield-placeholder large">
              <span className="team-shield-initial">{homeShort[0]}</span>
            </div>
            <div className="match-detail-team-name">{homeShort}</div>
          </div>
          <div>
            {scoreHome != null && scoreAway != null ? (
              <div className="match-detail-score">{scoreHome} - {scoreAway}</div>
            ) : (
              <div className="match-detail-score" style={{ color: 'var(--text-muted)' }}>vs</div>
            )}
            {isLiveMatch && minute && (
              <div className="match-detail-minute"><span className="live-dot" /> {minute}'</div>
            )}
          </div>
          <div className="match-detail-team">
            <div className="team-shield-placeholder large">
              <span className="team-shield-initial">{awayShort[0]}</span>
            </div>
            <div className="match-detail-team-name">{awayShort}</div>
          </div>
        </div>
      </div>

      <div className="tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="page-content">
        {activeTab === 'overview' && <OverviewTab stats={stats} />}
        {activeTab === 'ai' && (
          <AITab
            matchId={fId}
            home={homeShort}
            away={awayShort}
            league={f.league?.name || ''}
            status={statusShort || 'NS'}
            minute={minute || undefined}
            score={scoreHome != null && scoreAway != null ? { home: scoreHome, away: scoreAway } : undefined}
            stats={stats}
            analysis={analysis}
            analysisLoading={analysisLoading}
            onPrepareAnalysis={handlePrepareAnalysis}
          />
        )}
        {activeTab === 'odds' && <OddsTab odds={odds} onPrepareAnalysis={handlePrepareAnalysis} analysisLoading={analysisLoading} />}
        {activeTab === 'stats' && <StatsTab stats={stats} />}
        {activeTab === 'players' && <PlayersTab players={players} />}
        {activeTab === 'lineups' && <LineupsTab lineups={lineups} />}
        {activeTab === 'h2h' && <H2HTab h2h={h2h} onPrepareAnalysis={handlePrepareAnalysis} analysisLoading={analysisLoading} />}
        {activeTab === 'json' && (
          <pre style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 16,
            fontSize: 12,
            color: 'var(--text-secondary)',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}>
            {JSON.stringify(detail, null, 2)}
          </pre>
        )}
      </div>
    </>
  );
}

function OverviewTab({ stats }: { stats: FixtureDetailResponse['statistics'] | undefined }) {
  if (!stats || stats.length < 2) {
    return <div className="empty-state"><div className="empty-state-title">Sem estatísticas</div></div>;
  }

  const homeStats = stats[0]?.statistics || [];
  const awayStats = stats[1]?.statistics || [];

  const getStat = (type: string, data: typeof homeStats): number => {
    const found = data.find((s) => s.type === type);
    return typeof found?.value === 'number' ? found.value : parseInt(String(found?.value || '0'), 10) || 0;
  };

  const comparisons = [
    { label: 'Posse', type: 'Ball Possession' },
    { label: 'Chutes', type: 'Total Shots' },
    { label: 'No gol', type: 'Shots on Goal' },
    { label: 'Escanteios', type: 'Corner Kicks' },
    { label: 'Faltas', type: 'Fouls' },
    { label: 'Cartões amarelos', type: 'Yellow Cards' },
    { label: 'Cartões vermelhos', type: 'Red Cards' },
  ];

  return (
    <div className="comparison-section">
      <div className="comparison-title">Comparação entre Times</div>
      {comparisons.map((c) => {
        const home = getStat(c.type, homeStats);
        const away = getStat(c.type, awayStats);
        const total = home + away;
        const homePct = total > 0 ? (home / total) * 100 : 50;
        return (
          <div key={c.label} className="comparison-row">
            <div className="comparison-values">
              <span>{c.type.includes('Possession') ? `${home}` : home}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.label}</span>
              <span>{c.type.includes('Possession') ? `${away}` : away}</span>
            </div>
            <div className="comparison-bar">
              <div className="comparison-bar-home" style={{ width: `${homePct}%` }} />
              <div className="comparison-bar-away" style={{ width: `${100 - homePct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AITab({
  matchId, home, away, league, status, minute, score, stats, analysis, analysisLoading, onPrepareAnalysis,
}: {
  matchId: number;
  home: string;
  away: string;
  league: string;
  status: string;
  minute?: number;
  score?: { home: number; away: number };
  stats: FixtureDetailResponse['statistics'] | undefined;
  analysis: FixtureDetailResponse | null;
  analysisLoading: boolean;
  onPrepareAnalysis: () => void;
}) {
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      // Build stats payload from API data
      const homeStats = stats?.[0]?.statistics || [];
      const awayStats = stats?.[1]?.statistics || [];

      const getStat = (type: string, data: typeof homeStats): number => {
        const found = data.find((s) => s.type === type);
        return typeof found?.value === 'number' ? found.value : parseInt(String(found?.value || '0'), 10) || 0;
      };

      const payload = {
        fixture: {
          id: matchId,
          home,
          away,
          league,
          status,
          minute,
          score,
        },
        statistics: {
          homePossession: getStat('Ball Possession', homeStats),
          awayPossession: getStat('Ball Possession', awayStats),
          homeShots: getStat('Total Shots', homeStats),
          awayShots: getStat('Total Shots', awayStats),
          homeShotsOnTarget: getStat('Shots on Goal', homeStats),
          awayShotsOnTarget: getStat('Shots on Goal', awayStats),
          homeCorners: getStat('Corner Kicks', homeStats),
          awayCorners: getStat('Corner Kicks', awayStats),
          homeFouls: getStat('Fouls', homeStats),
          awayFouls: getStat('Fouls', awayStats),
        },
        odds: analysis?.odds || [],
        h2h: analysis?.h2h || [],
        profile: 'balanced' as const,
        reasoning: 'high' as const,
      };

      const response = await analyzeMatch(payload);
      setResult(response);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Análise falhou');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      <div className="ai-header">
        <Brain size={24} className="ai-header-icon" />
        <div className="ai-header-text">
          <h3>ANÁLISE COM IA</h3>
          <p>{home} x {away}</p>
          {minute && <p style={{ fontSize: 12, color: 'var(--red)' }}>{minute}' • {score?.home}–{score?.away}</p>}
        </div>
      </div>

      <div className="ai-model-info">
        <span className="model-badge primary">Kimi K3</span>
        <span className="model-badge">DEMO — ainda não conectado</span>
      </div>

      {!analysis && (
        <button
          className="btn-analyze-ai"
          onClick={onPrepareAnalysis}
          disabled={analysisLoading}
          style={{ marginTop: 16 }}
        >
          {analysisLoading ? '⏳ Carregando dados...' : '📊 Preparar Análise'}
        </button>
      )}

      {analysis && !result && (
        <button
          className="btn-analyze-ai"
          onClick={handleAnalyze}
          disabled={analyzing}
          style={{ marginTop: 16 }}
        >
          {analyzing ? '⏳ Analisando...' : '⚡ ANALISAR COM IA'}
        </button>
      )}

      {analyzeError && (
        <div className="empty-state" style={{ marginTop: 16 }}>
          <AlertTriangle size={48} style={{ color: 'var(--red)', marginBottom: 16 }} />
          <div className="empty-state-title">Erro na análise</div>
          <div className="empty-state-text">{analyzeError}</div>
        </div>
      )}

      {result?.entries?.[0] && (
        <div className="result-card" style={{ marginTop: 16 }}>
          <div className="result-card-header">
            <span className="result-badge best-entry">Melhor Entrada</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{result.analyzedAt}</span>
          </div>
          <div className="result-card-body">
            <div className="result-row">
              <span className="result-label">Mercado</span>
              <span className="result-value">{result.entries[0].market}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Odd atual</span>
              <span className="result-value">{result.entries[0].currentOdd.toFixed(2)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Probabilidade</span>
              <span className="result-value">{(result.entries[0].estimatedProbability * 100).toFixed(0)}%</span>
            </div>
            <div className="result-row">
              <span className="result-label">Odd justa</span>
              <span className="result-value">{result.entries[0].fairOdd.toFixed(2)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Edge</span>
              <span className="result-value positive">+{result.entries[0].edge.toFixed(1)}%</span>
            </div>
            <div className="result-row">
              <span className="result-label">Risco</span>
              <span className={`risk-badge ${result.entries[0].risk}`}>
                {result.entries[0].risk === 'low' ? 'Baixo' : result.entries[0].risk === 'moderate' ? 'Moderado' : 'Alto'}
              </span>
            </div>
            <div className="result-row">
              <span className="result-label">Confiança</span>
              <span className="result-value">{result.entries[0].confidence}%</span>
            </div>
            <div className="result-row">
              <span className="result-label">Decisão</span>
              <span className={`decision-badge ${result.entries[0].decision}`}>
                {decisionLabels[result.entries[0].decision]}
              </span>
            </div>
          </div>
          <div className="result-explanation">
            <div className="result-explanation-title">💡 POR QUE ESTA ENTRADA?</div>
            <div className="result-explanation-text">{result.entries[0].explanation}</div>
          </div>
        </div>
      )}

      {result && !result.entries?.[0] && (
        <div className="empty-state" style={{ marginTop: 16 }}>
          <AlertTriangle size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <div className="empty-state-title">SEM ENTRADA</div>
          <div className="empty-state-text">Nenhum mercado apresenta relação probabilidade × risco × odd suficiente.</div>
        </div>
      )}
    </>
  );
}

function OddsTab({ odds, onPrepareAnalysis, analysisLoading }: { odds: unknown; onPrepareAnalysis: () => void; analysisLoading: boolean }) {
  const oddsList = Array.isArray(odds) ? odds as Array<{
    bookmakers?: Array<{ name: string; bets?: Array<{ name: string; values?: Array<{ value: string; odd: string }> }> }>;
  }> : [];

  if (oddsList.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">Odds não disponíveis</div>
        <div className="empty-state-text">Carregue os dados de análise para ver odds</div>
        <button className="btn-analyze" style={{ marginTop: 16 }} onClick={onPrepareAnalysis} disabled={analysisLoading}>
          {analysisLoading ? 'Carregando...' : 'Carregar Odds'}
        </button>
      </div>
    );
  }

  return (
    <div className="odds-table">
      <div className="odds-row odds-row-header">
        <span>Corretora</span>
        <span>Mercado</span>
        <span>Linha</span>
        <span>Odd</span>
      </div>
      {oddsList.slice(0, 5).map((o, i) => {
        const bookmaker = o.bookmakers?.[0];
        const bet = bookmaker?.bets?.[0];
        return (
          <div key={i} className="odds-row">
            <span>{bookmaker?.name || '-'}</span>
            <span>{bet?.name || '-'}</span>
            <span>{bet?.values?.[0]?.value || '-'}</span>
            <span style={{ fontWeight: 600 }}>{bet?.values?.[0]?.odd || '-'}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatsTab({ stats }: { stats: FixtureDetailResponse['statistics'] | undefined }) {
  if (!stats || stats.length < 2) {
    return <div className="empty-state"><div className="empty-state-title">Sem estatísticas</div></div>;
  }

  const homeStats = stats[0]?.statistics || [];
  const awayStats = stats[1]?.statistics || [];

  const getStat = (type: string, data: typeof homeStats): string => {
    const found = data.find((s) => s.type === type);
    return String(found?.value ?? '-');
  };

  const statTypes = [
    'Ball Possession', 'Total Shots', 'Shots on Goal', 'Corner Kicks',
    'Fouls', 'Yellow Cards', 'Red Cards', 'Offsides',
  ];

  return (
    <div className="stats-grid">
      {statTypes.map((type) => (
        <div key={type} className="stat-box">
          <div className="stat-label">{type}</div>
          <div className="stat-values">
            <span className="stat-home">{getStat(type, homeStats)}</span>
            <span className="stat-vs">-</span>
            <span className="stat-away">{getStat(type, awayStats)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlayersTab({ players }: { players: FixtureDetailResponse['players'] | undefined }) {
  if (!players || players.length === 0) {
    return <div className="empty-state"><div className="empty-state-title">Sem jogadores</div></div>;
  }

  return (
    <div>
      {players.slice(0, 20).map((p, i) => (
        <div key={p.player?.id || i} className="player-card">
          <div className="player-header">
            <div className="player-avatar">{p.player?.name?.[0] || '?'}</div>
            <div className="player-info">
              <div className="player-name">{p.player?.name}</div>
              <div className="player-meta">
                {p.player?.position || ''} {p.player?.captain ? '• Capitão' : ''}
              </div>
            </div>
            {p.player?.substitute && <span className="player-substituted">RESERVA</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function LineupsTab({ lineups }: { lineups: FixtureDetailResponse['lineups'] | undefined }) {
  if (!lineups || lineups.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">Escalações</div>
        <div className="empty-state-text">Escalações ainda não disponíveis</div>
      </div>
    );
  }

  return (
    <div>
      {lineups.map((l, i) => (
        <div key={i} className="player-card">
          <div className="player-header">
            <div className="player-info">
              <div className="player-name">{l.team?.name}</div>
              <div className="player-meta">Formação: {l.formation}</div>
            </div>
          </div>
          <div style={{ padding: '0 14px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
            {l.startXI?.map((p, j) => (
              <div key={j} style={{ padding: '2px 0' }}>
                {p.player?.number}. {p.player?.name} ({p.player?.pos})
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function H2HTab({ h2h, onPrepareAnalysis, analysisLoading }: { h2h: unknown[] | undefined; onPrepareAnalysis: () => void; analysisLoading: boolean }) {
  if (!h2h || h2h.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">Confronto Direto</div>
        <div className="empty-state-text">Carregue os dados de análise para ver H2H</div>
        <button className="btn-analyze" style={{ marginTop: 16 }} onClick={onPrepareAnalysis} disabled={analysisLoading}>
          {analysisLoading ? 'Carregando...' : 'Carregar H2H'}
        </button>
      </div>
    );
  }

  return (
    <div>
      {h2h.map((h, i) => {
        const match = h as { teams?: { home?: { name?: string }; away?: { name?: string } }; goals?: { home?: number; away?: number }; fixture?: { date?: string } };
        return (
          <div key={i} className="match-card" style={{ cursor: 'default' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              {match.fixture?.date?.split('T')[0] || ''}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>{match.teams?.home?.name}</span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                {match.goals?.home ?? '-'} - {match.goals?.away ?? '-'}
              </span>
              <span style={{ fontWeight: 600 }}>{match.teams?.away?.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
