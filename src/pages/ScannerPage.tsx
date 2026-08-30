import { ScannerFilter } from '../types';
import { ScanLine } from 'lucide-react';

const filterLabels: Record<ScannerFilter, string> = {
  'all': 'Todos',
  'high-confidence': 'Alta confiança',
  'positive-edge': 'Edge positivo',
  'low-risk': 'Baixo risco',
  'goals': 'Gols',
  'corners': 'Escanteios',
  'cards': 'Cartões',
  'players': 'Jogadores',
};

export default function ScannerPage() {
  const filters: { key: ScannerFilter; label: string }[] = Object.entries(filterLabels).map(
    ([key, label]) => ({ key: key as ScannerFilter, label }),
  );

  return (
    <>
      <header className="header">
        <div className="header-logo">
          <h1>Scanner de Valor</h1>
        </div>
      </header>

      <div className="scanner-header">
        <div className="scanner-filters">
          {filters.map((f) => (
            <button key={f.key} className="scanner-filter-chip">
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="empty-state">
        <ScanLine size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <div className="empty-state-title">Scanner aguardando dados</div>
        <div className="empty-state-text">
          O scanner de valor será ativado quando houver dados suficientes
          de odds e estatísticas em tempo real.
        </div>
      </div>
    </>
  );
}
