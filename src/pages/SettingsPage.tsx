import { mockSettings } from '../mocks/data';

export default function SettingsPage() {
  const s = mockSettings;

  return (
    <>
      <header className="header">
        <div className="header-logo">
          <h1>⚙️ Settings</h1>
        </div>
      </header>

      <div style={{ padding: '16px 0' }}>
        <div className="settings-section">
          <div className="settings-section-title">Analysis</div>
          <div className="settings-card">
            <div className="settings-item">
              <span className="settings-item-label">Risk Profile</span>
              <span className="settings-item-value">{s.analysis.riskProfile}</span>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Min Edge</span>
              <span className="settings-item-value">{s.analysis.minEdge}%</span>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Min Probability</span>
              <span className="settings-item-value">{(s.analysis.minProbability * 100).toFixed(0)}%</span>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Min Odd</span>
              <span className="settings-item-value">{s.analysis.minOdd}</span>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Max Recommendations</span>
              <span className="settings-item-value">{s.analysis.maxRecommendations}</span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">AI</div>
          <div className="settings-card">
            <div className="settings-item">
              <span className="settings-item-label">Model</span>
              <span className="settings-item-value">{s.ai.model}</span>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Fallback</span>
              <span className="settings-item-value">{s.ai.fallback}</span>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Reasoning</span>
              <span className="settings-item-value">{s.ai.reasoning}</span>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Status</span>
              <span className="settings-item-value">
                <span className={`status-dot ${s.ai.status}`} />
                {s.ai.status}
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
                <span className={`status-dot ${s.api.status === 'connected' ? 'online' : 'offline'}`} />
                {s.api.status}
              </span>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Quota Remaining</span>
              <span className="settings-item-value">{s.api.quota}</span>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Last Update</span>
              <span className="settings-item-value">{s.api.lastUpdate}</span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Preferences</div>
          <div className="settings-card">
            <div className="settings-item">
              <span className="settings-item-label">Theme</span>
              <span className="settings-item-value">{s.preferences.theme}</span>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Language</span>
              <span className="settings-item-value">{s.preferences.language}</span>
            </div>
            <div className="settings-item">
              <span className="settings-item-label">Timezone</span>
              <span className="settings-item-value">{s.preferences.timezone}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
