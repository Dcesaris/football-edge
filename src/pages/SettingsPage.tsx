import { useState, useEffect } from 'react';
import { checkAPIStatus, checkAIStatus } from '../services/api';

export default function SettingsPage() {
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [minEdge, setMinEdge] = useState(5.0);
  const [minProb, setMinProb] = useState(55);
  const [minOdd, setMinOdd] = useState(1.50);
  const [maxRecs, setMaxRecs] = useState(3);
  const [reasoning, setReasoning] = useState<'fast' | 'high' | 'maximum'>('high');
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [aiConnected, setAiConnected] = useState<boolean | null>(null);

  useEffect(() => {
    checkAPIStatus().then(setApiConnected);
    checkAIStatus().then(setAiConnected);
  }, []);

  return (
    <>
      <header className="header">
        <div className="header-logo">
          <h1>Configurações</h1>
        </div>
      </header>

      <div style={{ padding: '16px 0' }}>
        <div className="settings-section">
          <div className="settings-section-title">ANÁLISE</div>
          <div className="settings-card">
            <div className="settings-item">
              <span className="settings-item-label">Perfil de risco</span>
              <div className="control-options" style={{ flex: 'none' }}>
                {(['conservative', 'balanced', 'aggressive'] as const).map((p) => (
                  <button
                    key={p}
                    className={`control-option compact ${riskProfile === p ? 'active' : ''}`}
                    onClick={() => setRiskProfile(p)}
                  >
                    {p === 'conservative' ? 'Conservador' : p === 'balanced' ? 'Equilibrado' : 'Agressivo'}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Edge mínimo</span>
              <div className="settings-control">
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={0.5}
                  value={minEdge}
                  onChange={(e) => setMinEdge(parseFloat(e.target.value))}
                  className="settings-range"
                />
                <span className="settings-item-value">{minEdge}%</span>
              </div>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Probabilidade mínima</span>
              <div className="settings-control">
                <input
                  type="range"
                  min={30}
                  max={90}
                  step={5}
                  value={minProb}
                  onChange={(e) => setMinProb(parseInt(e.target.value))}
                  className="settings-range"
                />
                <span className="settings-item-value">{minProb}%</span>
              </div>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Odd mínima</span>
              <div className="settings-control">
                <input
                  type="range"
                  min={1.01}
                  max={5.00}
                  step={0.05}
                  value={minOdd}
                  onChange={(e) => setMinOdd(parseFloat(e.target.value))}
                  className="settings-range"
                />
                <span className="settings-item-value">{minOdd.toFixed(2)}</span>
              </div>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Máx. recomendações</span>
              <div className="control-options" style={{ flex: 'none' }}>
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    className={`control-option compact ${maxRecs === n ? 'active' : ''}`}
                    onClick={() => setMaxRecs(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">IA</div>
          <div className="settings-card">
            <div className="settings-item">
              <span className="settings-item-label">Modelo</span>
              <span className="settings-item-value">Kimi K3</span>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Fallback</span>
              <span className="settings-item-value">Nemotron</span>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Reasoning</span>
              <div className="control-options" style={{ flex: 'none' }}>
                {(['fast', 'high', 'maximum'] as const).map((r) => (
                  <button
                    key={r}
                    className={`control-option compact ${reasoning === r ? 'active' : ''}`}
                    onClick={() => setReasoning(r)}
                  >
                    {r === 'fast' ? 'Rápido' : r === 'high' ? 'Alto' : 'Máximo'}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Status</span>
              <span className="settings-item-value">
                <span className={`status-dot ${aiConnected === true ? 'online' : 'offline'}`} />
                {aiConnected === null ? 'Verificando...' : aiConnected ? 'CONECTADO' : 'NÃO CONFIGURADO'}
              </span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">API</div>
          <div className="settings-card">
            <div className="settings-item">
              <span className="settings-item-label">API-Football</span>
              <span className="settings-item-value">
                <span className={`status-dot ${apiConnected === true ? 'online' : 'offline'}`} />
                {apiConnected === null ? 'Verificando...' : apiConnected ? 'CONECTADO' : 'NÃO CONFIGURADO'}
              </span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">PREFERÊNCIAS</div>
          <div className="settings-card">
            <div className="settings-item">
              <span className="settings-item-label">Tema</span>
              <span className="settings-item-value">Escuro</span>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Idioma</span>
              <span className="settings-item-value">Português (BR)</span>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Timezone</span>
              <span className="settings-item-value">UTC</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
