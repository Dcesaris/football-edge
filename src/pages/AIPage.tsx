import { useState } from 'react';
import { mockAIResult } from '../mocks/data';
import { Brain, AlertTriangle } from 'lucide-react';

const profileLabels = { conservative: 'Conservador', balanced: 'Equilibrado', aggressive: 'Agressivo' };
const reasoningLabels = { fast: 'Rápido', high: 'Alto', maximum: 'Máximo' };
const decisionLabels = { ENTER: 'ENTRAR', WATCH: 'OBSERVAR', NO_BET: 'SEM ENTRADA' };

export default function AIPage() {
  const [profile, setProfile] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [reasoning, setReasoning] = useState<'fast' | 'high' | 'maximum'>('high');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(mockAIResult);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setResult(mockAIResult);
    }, 2000);
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

      {result.entry && (
        <div className="result-card" style={{ marginTop: 16 }}>
          <div className="result-card-header">
            <span className="result-badge best-entry">Melhor Entrada</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{result.analyzedAt}</span>
          </div>
          <div className="result-card-body">
            <div className="result-row">
              <span className="result-label">Mercado</span>
              <span className="result-value">{result.entry.market}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Odd atual</span>
              <span className="result-value">{result.entry.currentOdd.toFixed(2)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Probabilidade</span>
              <span className="result-value">{(result.entry.probability * 100).toFixed(0)}%</span>
            </div>
            <div className="result-row">
              <span className="result-label">Odd justa</span>
              <span className="result-value">{result.entry.fairOdd.toFixed(2)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Odd mínima</span>
              <span className="result-value">{result.entry.minOdd.toFixed(2)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Edge</span>
              <span className="result-value positive">+{result.entry.edge.toFixed(1)}%</span>
            </div>
            <div className="result-row">
              <span className="result-label">Risco</span>
              <span className={`risk-badge ${result.entry.risk}`}>
                {result.entry.risk === 'low' ? 'Baixo' : result.entry.risk === 'moderate' ? 'Moderado' : 'Alto'}
              </span>
            </div>
            <div className="result-row">
              <span className="result-label">Confiança</span>
              <span className="result-value">{result.entry.confidence}%</span>
            </div>
            <div className="result-row">
              <span className="result-label">Decisão</span>
              <span className={`decision-badge ${result.entry.decision}`}>
                {decisionLabels[result.entry.decision]}
              </span>
            </div>
          </div>
          <div className="result-explanation">
            <div className="result-explanation-title">💡 POR QUE ESTA ENTRADA?</div>
            <div className="result-explanation-text">{result.entry.explanation}</div>
          </div>
        </div>
      )}

      {!result.entry && (
        <div className="empty-state" style={{ marginTop: 16 }}>
          <AlertTriangle size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <div className="empty-state-title">SEM ENTRADA</div>
          <div className="empty-state-text">
            Nenhum mercado apresenta relação probabilidade × risco × odd suficiente neste momento.
          </div>
        </div>
      )}
    </>
  );
}
