import { useState } from 'react';
import { TabType } from '../types';
import { mockMatches, mockOdds, mockPlayers, mockAIResult } from '../mocks/data';

interface MatchDetailPageProps {
  matchId: string;
  onBack: () => void;
}

const tabs: { key: TabType; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'ai', label: 'AI' },
  { key: 'odds', label: 'Odds' },
  { key: 'stats', label: 'Stats' },
  { key: 'players', label: 'Players' },
  { key: 'lineups', label: 'Lineups' },
  { key: 'h2h', label: 'H2H' },
  { key: 'json', label: 'JSON' },
];

export default function MatchDetailPage({ matchId, onBack }: MatchDetailPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const match = mockMatches.find((m) => m.id === matchId) || mockMatches[0];

  return (
    <>
      <div className="match-detail-header">
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--blue)',
            fontSize: 14,
            cursor: 'pointer',
            marginBottom: 8,
          }}
        >
          ← Back
        </button>
        <div className="match-detail-competition">
          {match.league.badge} {match.league.name}
        </div>
        <div className="match-detail-teams">
          <div className="match-detail-team">
            <span style={{ fontSize: 28 }}>{match.home.shield}</span>
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
            <span style={{ fontSize: 28 }}>{match.away.shield}</span>
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
        {activeTab === 'ai' && <AITab />}
        {activeTab === 'odds' && <OddsTab />}
        {activeTab === 'stats' && <StatsTab match={match} />}
        {activeTab === 'players' && <PlayersTab />}
        {activeTab === 'lineups' && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">Lineups</div>
            <div className="empty-state-text">Lineups not yet available</div>
          </div>
        )}
        {activeTab === 'h2h' && (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">Head to Head</div>
            <div className="empty-state-text">H2H data loading...</div>
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
  if (!stats) return <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-title">No stats available</div></div>;

  const comparisons = [
    { label: 'xG', home: stats.xG.home, away: stats.xG.away },
    { label: 'Shots', home: stats.shots.home, away: stats.shots.away },
    { label: 'Shots on Target', home: stats.shotsOnTarget.home, away: stats.shotsOnTarget.away },
    { label: 'Corners', home: stats.corners.home, away: stats.corners.away },
    { label: 'Cards', home: stats.cards.home, away: stats.cards.away },
    { label: 'Possession', home: stats.possession.home, away: stats.possession.away },
    { label: 'Fouls', home: stats.fouls.home, away: stats.fouls.away },
  ];

  return (
    <div className="comparison-section">
      <div className="comparison-title">Team Comparison</div>
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

function AITab() {
  const result = mockAIResult;
  return (
    <>
      <div className="ai-header">
        <span className="ai-header-icon">🧠</span>
        <div className="ai-header-text">
          <h3>ANALYSIS WITH AI</h3>
          <p>Model: {result.model} | Fallback: {result.fallback}</p>
        </div>
      </div>
      {result.entry && (
        <div className="result-card">
          <div className="result-card-header">
            <span className="result-badge best-entry">🏆 Best Entry</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{result.analyzedAt}</span>
          </div>
          <div className="result-card-body">
            <div className="result-row">
              <span className="result-label">Market</span>
              <span className="result-value">{result.entry.market}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Odd</span>
              <span className="result-value">{result.entry.currentOdd.toFixed(2)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Probability</span>
              <span className="result-value">{(result.entry.probability * 100).toFixed(0)}%</span>
            </div>
            <div className="result-row">
              <span className="result-label">Edge</span>
              <span className="result-value positive">+{result.entry.edge.toFixed(1)}%</span>
            </div>
            <div className="result-row">
              <span className="result-label">Risk</span>
              <span className={`risk-badge ${result.entry.risk}`}>{result.entry.risk}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Confidence</span>
              <span className="result-value">{result.entry.confidence}%</span>
            </div>
            <div className="result-row">
              <span className="result-label">Decision</span>
              <span className={`decision-badge ${result.entry.decision}`}>{result.entry.decision}</span>
            </div>
          </div>
          <div className="result-explanation">
            <div className="result-explanation-title">💡 WHY THIS ENTRY?</div>
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
        <span>Bookmaker</span>
        <span>Market</span>
        <span>Line</span>
        <span>Odd</span>
        <span>Edge</span>
        <span>Source</span>
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
          <span className={`odds-source-badge ${o.source}`}>{o.source}</span>
        </div>
      ))}
    </div>
  );
}

function StatsTab({ match }: { match: any }) {
  if (!match.stats) return <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-title">No stats</div></div>;

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
        <div className="stat-label">Shots</div>
        <div className="stat-values">
          <span className="stat-home">{s.shots.home}</span>
          <span className="stat-vs">-</span>
          <span className="stat-away">{s.shots.away}</span>
        </div>
      </div>
      <div className="stat-box">
        <div className="stat-label">On Target</div>
        <div className="stat-values">
          <span className="stat-home">{s.shotsOnTarget.home}</span>
          <span className="stat-vs">-</span>
          <span className="stat-away">{s.shotsOnTarget.away}</span>
        </div>
      </div>
      <div className="stat-box">
        <div className="stat-label">Corners</div>
        <div className="stat-values">
          <span className="stat-home">{s.corners.home}</span>
          <span className="stat-vs">-</span>
          <span className="stat-away">{s.corners.away}</span>
        </div>
      </div>
      <div className="stat-box">
        <div className="stat-label">Cards</div>
        <div className="stat-values">
          <span className="stat-home">{s.cards.home}</span>
          <span className="stat-vs">-</span>
          <span className="stat-away">{s.cards.away}</span>
        </div>
      </div>
      <div className="stat-box">
        <div className="stat-label">Possession</div>
        <div className="stat-values">
          <span className="stat-home">{s.possession.home}%</span>
          <span className="stat-vs">-</span>
          <span className="stat-away">{s.possession.away}%</span>
        </div>
      </div>
      <div className="stat-box">
        <div className="stat-label">Fouls</div>
        <div className="stat-values">
          <span className="stat-home">{s.fouls.home}</span>
          <span className="stat-vs">-</span>
          <span className="stat-away">{s.fouls.away}</span>
        </div>
      </div>
      <div className="stat-box">
        <div className="stat-label">Pressure</div>
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
            <div className="player-avatar">{p.avatar}</div>
            <div className="player-info">
              <div className="player-name">{p.name}</div>
              <div className="player-meta">{p.team} • {p.position} • {p.isStarter ? 'Starter' : 'Sub'} • {p.minutes}'</div>
            </div>
            {p.substituted && <span className="player-substituted">SUB</span>}
          </div>
          <div className="player-stats">
            <div>
              <div className="scanner-stat-label">Stat</div>
              <div className="scanner-stat-value" style={{ fontSize: 11 }}>{p.stat}</div>
            </div>
            <div>
              <div className="scanner-stat-label">Line</div>
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
