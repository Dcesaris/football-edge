import { useState } from 'react';
import { NavPage } from './types';
import BottomNav from './components/BottomNav';
import MatchesPage from './pages/MatchesPage';
import LivePage from './pages/LivePage';
import ScannerPage from './pages/ScannerPage';
import AIPage from './pages/AIPage';
import SettingsPage from './pages/SettingsPage';
import MatchDetailPage from './pages/MatchDetailPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('matches');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const handleNavigate = (page: NavPage) => {
    setCurrentPage(page);
    setSelectedMatchId(null);
  };

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
  };

  const handleBack = () => {
    setSelectedMatchId(null);
  };

  if (selectedMatchId) {
    return (
      <div className="app-container">
        <MatchDetailPage matchId={selectedMatchId} onBack={handleBack} />
        <BottomNav current={currentPage} onNavigate={handleNavigate} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {currentPage === 'matches' && <MatchesPage onSelectMatch={handleSelectMatch} />}
      {currentPage === 'live' && <LivePage onSelectMatch={handleSelectMatch} />}
      {currentPage === 'scanner' && <ScannerPage />}
      {currentPage === 'ai' && <AIPage />}
      {currentPage === 'settings' && <SettingsPage />}
      <BottomNav current={currentPage} onNavigate={handleNavigate} />
    </div>
  );
}
