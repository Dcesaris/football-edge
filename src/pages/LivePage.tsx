import { useState, useEffect, useCallback } from 'react';
import { Match } from '../types';
import { fetchFixtures } from '../services/api';
import MatchCard from '../components/MatchCard';
import { RefreshCw } from 'lucide-react';

interface LivePageProps {
  onSelectMatch: (id: string) => void;
}

export default function LivePage({ onSelectMatch }: LivePageProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const date = new Date().toISOString().split('T')[0];
      const data = await fetchFixtures(date, true);
      setMatches(data.filter((m) => m.status === 'live'));
      setLastUpdate(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar jogos ao vivo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <header className="header">
        <div className="header-logo">
          <h1>Ao Vivo</h1>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={load} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </header>

      <div className="data-status">
        <span className="data-status-item">
          {loading ? (
            <><span className="status-dot offline" /> Carregando...</>
          ) : error ? (
            <><span className="status-dot offline" /> {error}</>
          ) : (
            <><span className="status-dot online" /> {matches.length} jogo(s) ao vivo</>
          )}
        </span>
        {lastUpdate && (
          <span className="data-status-item">
            Atualizado às {lastUpdate}
          </span>
        )}
      </div>

      {loading && matches.length === 0 && (
        <div>
          {[1, 2].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔴</div>
          <div className="empty-state-title">Nenhum jogo ao vivo</div>
          <div className="empty-state-text">Verifique quando os jogos estiverem em andamento</div>
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
