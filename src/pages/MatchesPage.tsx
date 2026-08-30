import { useState } from 'react';
import { FilterType } from '../types';
import { mockMatches } from '../mocks/data';
import MatchCard from '../components/MatchCard';

interface MatchesPageProps {
  onSelectMatch: (id: string) => void;
}

export default function MatchesPage({ onSelectMatch }: MatchesPageProps) {
  const [filter, setFilter] = useState<FilterType>('today');

  const filtered = mockMatches.filter((m) => {
    if (filter === 'today') return m.date === '2026-08-30';
    if (filter === 'tomorrow') return m.date === '2026-08-31';
    return true;
  });

  return (
    <>
      <header className="header">
        <div className="header-logo">
          <h1>⚽ Football Edge</h1>
          <span className="header-date">Aug 30, 2026</span>
        </div>
        <div className="header-actions">
          <button className="icon-btn">🔍</button>
          <button className="icon-btn">🔄</button>
        </div>
      </header>

      <div className="filter-tabs">
        {(['today', 'tomorrow', 'calendar'] as FilterType[]).map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'today' ? 'Today' : f === 'tomorrow' ? 'Tomorrow' : '📅 Calendar'}
          </button>
        ))}
      </div>

      <div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-title">No matches</div>
            <div className="empty-state-text">No matches found for this date</div>
          </div>
        ) : (
          filtered.map((match) => (
            <MatchCard key={match.id} match={match} onClick={() => onSelectMatch(match.id)} />
          ))
        )}
      </div>
    </>
  );
}
