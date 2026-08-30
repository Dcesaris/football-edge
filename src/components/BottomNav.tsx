import { NavPage } from '../types';

interface BottomNavProps {
  current: NavPage;
  onNavigate: (page: NavPage) => void;
}

const items: { page: NavPage; icon: string; label: string }[] = [
  { page: 'matches', icon: '⚽', label: 'Matches' },
  { page: 'live', icon: '🔴', label: 'Live' },
  { page: 'scanner', icon: '🔍', label: 'Scanner' },
  { page: 'ai', icon: '🤖', label: 'AI' },
  { page: 'settings', icon: '⚙️', label: 'Settings' },
];

export default function BottomNav({ current, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.page}
          className={`nav-item ${current === item.page ? 'active' : ''}`}
          onClick={() => onNavigate(item.page)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
