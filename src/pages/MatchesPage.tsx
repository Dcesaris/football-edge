import { useState } from 'react';
import { FilterType } from '../types';
import { mockMatches } from '../mocks/data';
import MatchCard from '../components/MatchCard';
import { Search, RefreshCw, CalendarDays } from 'lucide-react';

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
          <h1>Football Edge</h1>
          <span className="header-date">30 Ago 2026</span>
        </div>
        <div className="header-actions">
          <button className="icon-btn"><Search size={16} /></button>
          <button className="icon-btn"><RefreshCw size={16} /></button>
        </div>
      </header>

      <div className="filter-tabs">
        {([
          { key: 'today' as FilterType, label: 'Hoje' },
          { key: 'tomorrow' as FilterType, label: 'Amanhã' },
          { key: 'calendar' as FilterType, label: 'Calendário' },
        ]).map((f) => (
          <button
            key={f.key}
            className={`filter-tab ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.key === 'calendar' && <CalendarDays size={14} style={{ marginRight: 4 }} />}
            {f.label}
          </button>
        ))}
      </div>

      <div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-title">Nenhum jogo</div>
            <div className="empty-state-text">Nenhum jogo encontrado para esta data</div>
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
