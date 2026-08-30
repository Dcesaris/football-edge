import { mockMatches } from '../mocks/data';
import MatchCard from '../components/MatchCard';
import { RefreshCw } from 'lucide-react';

interface LivePageProps {
  onSelectMatch: (id: string) => void;
}

export default function LivePage({ onSelectMatch }: LivePageProps) {
  const liveMatches = mockMatches.filter((m) => m.status === 'live');

  return (
    <>
      <header className="header">
        <div className="header-logo">
          <h1>Ao Vivo</h1>
        </div>
        <div className="header-actions">
          <button className="icon-btn"><RefreshCw size={16} /></button>
        </div>
      </header>

      <div className="data-status">
        <span className="data-status-item">
          <span className="status-dot online" />
          Dados ao vivo ativos
        </span>
        <span className="data-status-item">
          Atualizado há 18s
        </span>
      </div>

      <div>
        {liveMatches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔴</div>
            <div className="empty-state-title">Nenhum jogo ao vivo</div>
            <div className="empty-state-text">Verifique quando os jogos estiverem em andamento</div>
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
