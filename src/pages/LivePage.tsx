import { mockMatches } from '../mocks/data';
import MatchCard from '../components/MatchCard';

interface LivePageProps {
  onSelectMatch: (id: string) => void;
}

export default function LivePage({ onSelectMatch }: LivePageProps) {
  const liveMatches = mockMatches.filter((m) => m.status === 'live');

  return (
    <>
      <header className="header">
        <div className="header-logo">
          <h1>🔴 Live</h1>
        </div>
        <div className="header-actions">
          <button className="icon-btn">🔄</button>
        </div>
      </header>

      <div className="data-status">
        <span className="data-status-item">
          <span className="status-dot online" />
          Live data active
        </span>
        <span className="data-status-item">
          Updated 18s ago
        </span>
      </div>

      <div>
        {liveMatches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔴</div>
            <div className="empty-state-title">No live matches</div>
            <div className="empty-state-text">Check back when matches are in play</div>
          </div>
        ) : (
          liveMatches.map((match) => (
            <MatchCard key={match.id} match={match} onClick={() => onSelectMatch(match.id)} />
          ))
        )}
      </div>
    </>
  );
}
