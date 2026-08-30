import { useState } from 'react';
import { mockAIResult, mockMatches } from '../mocks/data';

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
          <h1>🤖 AI Analysis</h1>
        </div>
      </header>

      <div className="ai-header">
        <span className="ai-header-icon">🧠</span>
        <div className="ai-header-text">
          <h3>ANALYSIS WITH AI</h3>
          <p>Intelligent market analysis powered by Kimi K3</p>
        </div>
      </div>

      <div className="ai-model-info">
        <span className="model-badge primary">Kimi K3</span>
        <span className="model-badge">Nemotron (fallback)</span>
      </div>

      <div className="ai-controls">
        <div className="control-group">
          <div className="control-label">Profile</div>
          <div className="control-options">
            {(['conservative', 'balanced', 'aggressive'] as const).map((p) => (
              <button
                key={p}
                className={`control-option ${profile === p ? 'active' : ''}`}
                onClick={() => setProfile(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
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
                {r.charAt(0).toUpperCase() + r.slice(1)}
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
        {analyzing ? '⏳ Analyzing...' : '⚡ ANALYZE WITH AI'}
      </button>

      {result.entry && (
        <div className="result-card" style={{ marginTop: 16 }}>
          <div className="result-card-header">
            <span className="result-badge best-entry">🏆 Best Entry</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{result.analyzedAt}</span>
          </div>
          <div className="result-card-body">
            <div className="result-row">
              <span className="result-label">Market</span>
              <span className="result-value">{result.entry.market}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Current Odd</span>
              <span className="result-value">{result.entry.currentOdd.toFixed(2)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Probability</span>
              <span className="result-value">{(result.entry.probability * 100).toFixed(0)}%</span>
            </div>
            <div className="result-row">
              <span className="result-label">Fair Odd</span>
              <span className="result-value">{result.entry.fairOdd.toFixed(2)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Min Odd</span>
              <span className="result-value">{result.entry.minOdd.toFixed(2)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Edge</span>
              <span className="result-value positive">+{result.entry.edge.toFixed(1)}%</span>
            </div>
            <div className="result-row">
              <span className="result-label">Risk</span>
              <span className={`risk-badge ${result.entry.risk}`}>{result.entry.risk}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Confidence</span>
              <span className="result-value">{result.entry.confidence}%</span>
            </div>
            <div className="result-row">
              <span className="result-label">Decision</span>
              <span className={`decision-badge ${result.entry.decision}`}>{result.entry.decision}</span>
            </div>
          </div>
          <div className="result-explanation">
            <div className="result-explanation-title">💡 WHY THIS ENTRY?</div>
            <div className="result-explanation-text">{result.entry.explanation}</div>
          </div>
        </div>
      )}

      {!result.entry && (
        <div className="empty-state" style={{ marginTop: 16 }}>
          <div className="empty-state-icon">🚫</div>
          <div className="empty-state-title">NO ENTRY</div>
          <div className="empty-state-text">
            No market presents sufficient probability × risk × odd relationship at this time.
          </div>
        </div>
      )}
    </>
  );
}
