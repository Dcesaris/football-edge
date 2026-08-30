import { useState, useEffect } from 'react';
import { Brain, AlertTriangle } from 'lucide-react';
import { checkStatus } from '../services/api';

const profileLabels = { conservative: 'Conservador', balanced: 'Equilibrado', aggressive: 'Agressivo' };
const reasoningLabels = { fast: 'Rápido', high: 'Alto', maximum: 'Máximo' };

export default function AIPage() {
  const [profile, setProfile] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [reasoning, setReasoning] = useState<'fast' | 'high' | 'maximum'>('high');
  const [nvidiaConfigured, setNvidiaConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    checkStatus().then((s) => setNvidiaConfigured(s.nvidiaConfigured)).catch(() => setNvidiaConfigured(false));
  }, []);

  return (
    <>
      <header className="header">
        <div className="header-logo">
          <h1>Análise com IA</h1>
        </div>
      </header>

      <div className="ai-header">
        <Brain size={24} className="ai-header-icon" />
        <div className="ai-header-text">
          <h3>ANÁLISE COM IA</h3>
          <p>Análise inteligente de mercados</p>
        </div>
      </div>

      <div className="ai-model-info">
        <span className="model-badge primary">Kimi K3</span>
        <span className="model-badge">
          {nvidiaConfigured === null ? 'Verificando...' : nvidiaConfigured ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}
        </span>
      </div>

      <div className="ai-controls">
        <div className="control-group">
          <div className="control-label">Perfil</div>
          <div className="control-options">
            {(['conservative', 'balanced', 'aggressive'] as const).map((p) => (
              <button
                key={p}
                className={`control-option ${profile === p ? 'active' : ''}`}
                onClick={() => setProfile(p)}
              >
                {profileLabels[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <div className="control-label">Reasoning</div>
          <div className="control-options">
            {(['fast', 'high', 'maximum'] as const).map((r) => (
              <button
                key={r}
                className={`control-option ${reasoning === r ? 'active' : ''}`}
                onClick={() => setReasoning(r)}
              >
                {reasoningLabels[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="empty-state" style={{ marginTop: 16 }}>
        <Brain size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <div className="empty-state-title">Selecione uma partida</div>
        <div className="empty-state-text">
          Abra uma partida e use a aba IA para iniciar uma análise.
        </div>
      </div>
    </>
  );
}
