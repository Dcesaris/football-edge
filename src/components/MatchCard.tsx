import { Match } from '../types';

interface MatchCardProps {
  match: Match;
  onClick: () => void;
}

export default function MatchCard({ match, onClick }: MatchCardProps) {
  const isLive = match.status === 'live';

  return (
    <div className="match-card" onClick={onClick}>
      <div className="match-card-header">
        <div className="match-league">
          <span className="match-league-badge">{match.league.badge}</span>
          <span>{match.league.name}</span>
        </div>
        <span className={`match-time ${isLive ? 'live' : ''}`}>
          {isLive && <span className="live-dot" />}
          {isLive ? `${match.minute}'` : match.time}
        </span>
      </div>

      <div className="match-teams">
        <div className="team-info">
          <span className="team-shield">{match.home.shield}</span>
          <span className="team-name">{match.home.shortName}</span>
        </div>
        {match.score ? (
          <span className="team-score">{match.score.home} - {match.score.away}</span>
        ) : (
          <span className="team-score" style={{ color: 'var(--text-muted)', fontSize: 14 }}>vs</span>
        )}
        <div className="team-info away">
          <span className="team-name">{match.away.shortName}</span>
          <span className="team-shield">{match.away.shield}</span>
        </div>
      </div>

      {match.xG && (
        <div className="match-xg">
          <span>xG {match.xG.home.toFixed(2)}</span>
          <div className="xg-bar">
            <div
              className="xg-bar-home"
              style={{ width: `${(match.xG.home / (match.xG.home + match.xG.away)) * 100}%` }}
            />
            <div
              className="xg-bar-away"
              style={{ width: `${(match.xG.away / (match.xG.home + match.xG.away)) * 100}%` }}
            />
          </div>
          <span>xG {match.xG.away.toFixed(2)}</span>
        </div>
      )}

      {match.stats && (
        <div className="match-stats-mini">
          <span className="stat-mini"> Shots <span className="stat-mini-value">{match.stats.shots.home}-{match.stats.shots.away}</span></span>
          <span className="stat-mini"> Corners <span className="stat-mini-value">{match.stats.corners.home}-{match.stats.corners.away}</span></span>
          <span className="stat-mini"> Cards <span className="stat-mini-value">{match.stats.cards.home}-{match.stats.cards.away}</span></span>
        </div>
      )}

      <div className="match-footer">
        <div className="data-indicators">
          {match.hasOdds && <span className="data-badge odds">Odds</span>}
          {match.hasAI && <span className="data-badge ai">AI</span>}
        </div>
        <button className="btn-analyze">Analyze</button>
      </div>
    </div>
  );
}
