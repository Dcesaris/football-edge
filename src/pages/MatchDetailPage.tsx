import { useState } from 'react';
import { TabType } from '../types';
import { mockMatches, mockOdds, mockPlayers, mockAIResult } from '../mocks/data';
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

const decisionLabels = { ENTER: 'ENTRAR', WATCH: 'OBSERVAR', NO_BET: 'SEM ENTRADA' };
const sourceLabels = { live: 'AO VIVO', 'pre-match': 'PRÉ-JOGO', 'ai-inference': 'INFERÊNCIA IA' };

export default function MatchDetailPage({ matchId, onBack }: MatchDetailPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const match = mockMatches.find((m) => m.id === matchId) || mockMatches[0];

  return (
    <>
      <div className="match-detail-header">
        <button onClick={onBack} className="back-btn">
          <ArrowLeft size={16} />
          <span>Voltar</span>
        </button>
        <div className="match-detail-competition">
          {match.league.badge} {match.league.name}
        </div>
        <div className="match-detail-teams">
          <div className="match-detail-team">
            <div className="team-shield-placeholder large">
              <span className="team-shield-initial">{match.home.shortName[0]}</span>
            </div>
            <div className="match-detail-team-name">{match.home.shortName}</div>
          </div>
          <div>
            {match.score ? (
              <div className="match-detail-score">{match.score.home} - {match.score.away}</div>
            ) : (
              <div className="match-detail-score" style={{ color: 'var(--text-muted)' }}>vs</div>
            )}
            {match.minute && (
              <div className="match-detail-minute">
                <span className="live-dot" /> {match.minute}'
              </div>
            )}
          </div>
          <div className="match-detail-team">
            <div className="team-shield-placeholder large">
              <span className="team-shield-initial">{match.away.shortName[0]}</span>
            </div>
            <div className="match-detail-team-name">{match.away.shortName}</div>
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
        {activeTab === 'overview' && <OverviewTab match={match} />}
        {activeTab === 'ai' && <AITab match={match} />}
        {activeTab === 'odds' && <OddsTab />}
        {activeTab === 'stats' && <StatsTab match={match} />}
        {activeTab === 'players' && <PlayersTab />}
        {activeTab === 'lineups' && (
          <div className="empty-state">
            <div className="empty-state-title">Escalações</div>
            <div className="empty-state-text">Escalações ainda não disponíveis</div>
          </div>
        )}
        {activeTab === 'h2h' && (
          <div className="empty-state">
            <div className="empty-state-title">Confronto Direto</div>
            <div className="empty-state-text">Carregando dados H2H...</div>
          </div>
        )}
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
            {JSON.stringify(match, null, 2)}
          </pre>
        )}
      </div>
    </>
  );
}

function OverviewTab({ match }: { match: any }) {
  const stats = match.stats;
  if (!stats) return <div className="empty-state"><div className="empty-state-title">Sem estatísticas</div></div>;

  const comparisons = [
    { label: 'xG', home: stats.xG.home, away: stats.xG.away },
    { label: 'Chutes', home: stats.shots.home, away: stats.shots.away },
    { label: 'Chutes no gol', home: stats.shotsOnTarget.home, away: stats.shotsOnTarget.away },
    { label: 'Escanteios', home: stats.corners.home, away: stats.corners.away },
    { label: 'Cartões', home: stats.cards.home, away: stats.cards.away },
    { label: 'Posse', home: stats.possession.home, away: stats.possession.away },
    { label: 'Faltas', home: stats.fouls.home, away: stats.fouls.away },
  ];

  return (
    <div className="comparison-section">
      <div className="comparison-title">Comparação entre Times</div>
      {comparisons.map((c) => {
        const total = c.home + c.away;
        const homePct = total > 0 ? (c.home / total) * 100 : 50;
        return (
          <div key={c.label} className="comparison-row">
            <div className="comparison-values">
              <span>{typeof c.home === 'number' && c.home % 1 !== 0 ? c.home.toFixed(2) : c.home}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.label}</span>
              <span>{typeof c.away === 'number' && c.away % 1 !== 0 ? c.away.toFixed(2) : c.away}</span>
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

function AITab({ match }: { match: any }) {
  const result = mockAIResult;
  return (
    <>
      <div className="ai-header">
        <Brain size={24} className="ai-header-icon" />
        <div className="ai-header-text">
          <h3>ANÁLISE COM IA</h3>
          <p>{match.home.shortName} x {match.away.shortName}</p>
          {match.minute && (
            <p style={{ fontSize: 12, color: 'var(--red)' }}>
              {match.minute}' • {match.score?.home}–{match.score?.away}
            </p>
          )}
        </div>
      </div>

      <div className="ai-model-info">
        <span className="model-badge primary">Kimi K3</span>
        <span className="model-badge">DEMO — ainda não conectado</span>
      </div>

      {result.entry && (
        <div className="result-card">
          <div className="result-card-header">
            <span className="result-badge best-entry">Melhor Entrada</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{result.analyzedAt}</span>
          </div>
          <div className="result-card-body">
            <div className="result-row">
              <span className="result-label">Mercado</span>
              <span className="result-value">{result.entry.market}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Odd atual</span>
              <span className="result-value">{result.entry.currentOdd.toFixed(2)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Probabilidade</span>
              <span className="result-value">{(result.entry.probability * 100).toFixed(0)}%</span>
            </div>
            <div className="result-row">
              <span className="result-label">Odd justa</span>
              <span className="result-value">{result.entry.fairOdd.toFixed(2)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Odd mínima</span>
              <span className="result-value">{result.entry.minOdd.toFixed(2)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Edge</span>
              <span className="result-value positive">+{result.entry.edge.toFixed(1)}%</span>
            </div>
            <div className="result-row">
              <span className="result-label">Risco</span>
              <span className={`risk-badge ${result.entry.risk}`}>
                {result.entry.risk === 'low' ? 'Baixo' : result.entry.risk === 'moderate' ? 'Moderado' : 'Alto'}
              </span>
            </div>
            <div className="result-row">
              <span className="result-label">Confiança</span>
              <span className="result-value">{result.entry.confidence}%</span>
            </div>
            <div className="result-row">
              <span className="result-label">Decisão</span>
              <span className={`decision-badge ${result.entry.decision}`}>
                {decisionLabels[result.entry.decision]}
              </span>
            </div>
          </div>
          <div className="result-explanation">
            <div className="result-explanation-title">💡 POR QUE ESTA ENTRADA?</div>
            <div className="result-explanation-text">{result.entry.explanation}</div>
          </div>
        </div>
      )}
    </>
  );
}

function OddsTab() {
  return (
    <div className="odds-table">
      <div className="odds-row odds-row-header">
        <span>Corretora</span>
        <span>Mercado</span>
        <span>Linha</span>
        <span>Odd</span>
        <span>Edge</span>
        <span>Fonte</span>
      </div>
      {mockOdds.map((o, i) => (
        <div key={i} className="odds-row">
          <span>{o.bookmaker}</span>
          <span>{o.market}</span>
          <span>{o.line}</span>
          <span style={{ fontWeight: 600 }}>{o.currentOdd.toFixed(2)}</span>
          <span style={{ color: o.edge > 0 ? 'var(--green)' : o.edge < 0 ? 'var(--red)' : 'var(--text-muted)' }}>
            {o.edge > 0 ? '+' : ''}{o.edge.toFixed(1)}%
          </span>
          <span className={`odds-source-badge ${o.source}`}>{sourceLabels[o.source]}</span>
        </div>
      ))}
    </div>
  );
}

function StatsTab({ match }: { match: any }) {
  if (!match.stats) return <div className="empty-state"><div className="empty-state-title">Sem estatísticas</div></div>;

  const s = match.stats;
  return (
    <div className="stats-grid">
      <div className="stat-box">
        <div className="stat-label">xG</div>
        <div className="stat-values">
          <span className="stat-home">{s.xG.home.toFixed(2)}</span>
          <span className="stat-vs">-</span>
          <span className="stat-away">{s.xG.away.toFixed(2)}</span>
        </div>
      </div>
      <div className="stat-box">
        <div className="stat-label">Chutes</div>
        <div className="stat-values">
          <span className="stat-home">{s.shots.home}</span>
          <span className="stat-vs">-</span>
          <span className="stat-away">{s.shots.away}</span>
        </div>
      </div>
      <div className="stat-box">
        <div className="stat-label">No gol</div>
        <div className="stat-values">
          <span className="stat-home">{s.shotsOnTarget.home}</span>
          <span className="stat-vs">-</span>
          <span className="stat-away">{s.shotsOnTarget.away}</span>
        </div>
      </div>
      <div className="stat-box">
        <div className="stat-label">Escanteios</div>
        <div className="stat-values">
          <span className="stat-home">{s.corners.home}</span>
          <span className="stat-vs">-</span>
          <span className="stat-away">{s.corners.away}</span>
        </div>
      </div>
      <div className="stat-box">
        <div className="stat-label">Cartões</div>
        <div className="stat-values">
          <span className="stat-home">{s.cards.home}</span>
          <span className="stat-vs">-</span>
          <span className="stat-away">{s.cards.away}</span>
        </div>
      </div>
      <div className="stat-box">
        <div className="stat-label">Posse</div>
        <div className="stat-values">
          <span className="stat-home">{s.possession.home}%</span>
          <span className="stat-vs">-</span>
          <span className="stat-away">{s.possession.away}%</span>
        </div>
      </div>
      <div className="stat-box">
        <div className="stat-label">Faltas</div>
        <div className="stat-values">
          <span className="stat-home">{s.fouls.home}</span>
          <span className="stat-vs">-</span>
          <span className="stat-away">{s.fouls.away}</span>
        </div>
      </div>
      <div className="stat-box">
        <div className="stat-label">Pressão</div>
        <div className="stat-values">
          <span className="stat-home">{s.pressure.home}</span>
          <span className="stat-vs">-</span>
          <span className="stat-away">{s.pressure.away}</span>
        </div>
      </div>
    </div>
  );
}

function PlayersTab() {
  return (
    <div>
      {mockPlayers.map((p) => (
        <div key={p.id} className="player-card">
          <div className="player-header">
            <div className="player-avatar">{p.name[0]}</div>
            <div className="player-info">
              <div className="player-name">{p.name}</div>
              <div className="player-meta">{p.team} • {p.position} • {p.isStarter ? 'Titular' : 'Reserva'} • {p.minutes}'</div>
            </div>
            {p.substituted && <span className="player-substituted">SUBSTITUÍDO</span>}
          </div>
          <div className="player-stats">
            <div>
              <div className="scanner-stat-label">Estátistica</div>
              <div className="scanner-stat-value" style={{ fontSize: 11 }}>{p.stat}</div>
            </div>
            <div>
              <div className="scanner-stat-label">Linha</div>
              <div className="scanner-stat-value" style={{ fontSize: 11 }}>{p.line}</div>
            </div>
            <div>
              <div className="scanner-stat-label">Odd</div>
              <div className="scanner-stat-value">{p.odd.toFixed(2)}</div>
            </div>
            <div>
              <div className="scanner-stat-label">Edge</div>
              <div className={`scanner-stat-value ${p.edge > 0 ? 'edge-positive' : p.edge < 0 ? 'edge-negative' : ''}`}>
                {p.edge > 0 ? '+' : ''}{p.edge.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
