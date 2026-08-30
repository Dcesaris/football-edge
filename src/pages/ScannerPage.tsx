import { useState } from 'react';
import { ScannerFilter } from '../types';
import { mockScannerItems } from '../mocks/data';
import { RefreshCw, Zap, TrendingUp, Shield, Target } from 'lucide-react';

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
  const [filter, setFilter] = useState<ScannerFilter>('all');

  const filters: { key: ScannerFilter; label: string }[] = Object.entries(filterLabels).map(
    ([key, label]) => ({ key: key as ScannerFilter, label }),
  );

  return (
    <>
      <header className="header">
        <div className="header-logo">
          <h1>Scanner de Valor</h1>
        </div>
        <div className="header-actions">
          <button className="icon-btn"><RefreshCw size={16} /></button>
        </div>
      </header>

      <div className="scanner-header">
        <div className="scanner-filters">
          {filters.map((f) => (
            <button
              key={f.key}
              className={`scanner-filter-chip ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="scanner-list">
        {mockScannerItems.map((item) => (
          <div key={item.rank} className="scanner-item">
            <div className="scanner-item-header">
              <span className="scanner-rank">#{item.rank}</span>
              <div className="scanner-match">
                <div className="scanner-match-name">{item.match}</div>
                <div className="scanner-match-league">{item.league}</div>
              </div>
              <span className={`risk-badge ${item.risk}`}>
                {item.risk === 'low' ? 'Baixo' : item.risk === 'moderate' ? 'Moderado' : 'Alto'}
              </span>
            </div>
            <div className="scanner-item-body">
              <div>
                <div className="scanner-stat-label">Mercado</div>
                <div className="scanner-stat-value">{item.market}</div>
              </div>
              <div>
                <div className="scanner-stat-label">Odd</div>
                <div className="scanner-stat-value">{item.odd.toFixed(2)}</div>
              </div>
              <div>
                <div className="scanner-stat-label">Prob</div>
                <div className="scanner-stat-value">{(item.probability * 100).toFixed(0)}%</div>
              </div>
              <div>
                <div className="scanner-stat-label">Justa</div>
                <div className="scanner-stat-value">{item.fairOdd.toFixed(2)}</div>
              </div>
              <div>
                <div className="scanner-stat-label">Edge</div>
                <div className={`scanner-stat-value ${item.edge > 0 ? 'edge-positive' : 'edge-negative'}`}>
                  {item.edge > 0 ? '+' : ''}{item.edge.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
