import { useState, useEffect, useCallback } from 'react';
import { FilterType, Match } from '../types';
import { fetchFixtures } from '../services/api';
import MatchCard from '../components/MatchCard';
import { Search, RefreshCw, CalendarDays } from 'lucide-react';

interface MatchesPageProps {
  onSelectMatch: (id: string) => void;
}

function getDateForFilter(filter: FilterType): string {
  const now = new Date();
  if (filter === 'tomorrow') {
    now.setDate(now.getDate() + 1);
  }
  return now.toISOString().split('T')[0];
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MatchesPage({ onSelectMatch }: MatchesPageProps) {
  const [filter, setFilter] = useState<FilterType>('today');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const date = getDateForFilter(filter);
      const data = await fetchFixtures(date);
      setMatches(data);
      setLastUpdate(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar jogos');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const dateStr = getDateForFilter(filter);

  return (
    <>
      <header className="header">
        <div className="header-logo">
          <h1>Football Edge</h1>
          <span className="header-date">{formatDateHeader(dateStr)}</span>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={load} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
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

      {lastUpdate && (
        <div className="data-status">
          <span className="data-status-item">
            Atualizado às {lastUpdate}
          </span>
        </div>
      )}

      {loading && matches.length === 0 && (
        <div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="empty-state">
          <div className="empty-state-title">Erro ao carregar</div>
          <div className="empty-state-text">{error}</div>
          <button className="btn-analyze" style={{ marginTop: 16 }} onClick={load}>
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-title">Nenhum jogo</div>
          <div className="empty-state-text">Nenhum jogo encontrado para esta data</div>
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div>
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} onClick={() => onSelectMatch(match.id)} />
          ))}
        </div>
      )}
    </>
  );
}
