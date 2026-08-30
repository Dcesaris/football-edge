import { useState } from 'react';
import { Brain, AlertTriangle } from 'lucide-react';
import { analyzeMatch } from '../services/api';

const profileLabels = { conservative: 'Conservador', balanced: 'Equilibrado', aggressive: 'Agressivo' };
const reasoningLabels = { fast: 'Rápido', high: 'Alto', maximum: 'Máximo' };
const decisionLabels: Record<string, string> = { ENTER: 'ENTRAR', WATCH: 'OBSERVAR', NO_BET: 'SEM ENTRADA' };

export default function AIPage() {
  const [profile, setProfile] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [reasoning, setReasoning] = useState<'fast' | 'high' | 'maximum'>('high');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      // AIPage standalone needs a match context - for now show instruction
      setError('Selecione uma partida e use a aba IA para analisar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Análise falhou');
    } finally {
      setAnalyzing(false);
    }
  };

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
        <span className="model-badge">DEMO — ainda não conectado</span>
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

      <button
        className="btn-analyze-ai"
        onClick={handleAnalyze}
        disabled={analyzing}
      >
        {analyzing ? '⏳ Analisando...' : '⚡ ANALISAR COM IA'}
      </button>

      {error && (
        <div className="empty-state" style={{ marginTop: 16 }}>
          <AlertTriangle size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <div className="empty-state-title">IA não configurada</div>
          <div className="empty-state-text">
            Selecione uma partida e use a aba IA para analisar mercados específicos.
            Configure NVIDIA_API_KEY para ativar a análise.
          </div>
        </div>
      )}
    </>
  );
}
