import { NavPage } from '../types';
import { Trophy, Radio, ScanLine, Brain, Settings } from 'lucide-react';

interface BottomNavProps {
  current: NavPage;
  onNavigate: (page: NavPage) => void;
}

const items: { page: NavPage; icon: typeof Trophy; label: string }[] = [
  { page: 'matches', icon: Trophy, label: 'Jogos' },
  { page: 'live', icon: Radio, label: 'Ao Vivo' },
  { page: 'scanner', icon: ScanLine, label: 'Scanner' },
  { page: 'ai', icon: Brain, label: 'IA' },
  { page: 'settings', icon: Settings, label: 'Config' },
];

export default function BottomNav({ current, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.page}
            className={`nav-item ${current === item.page ? 'active' : ''}`}
            onClick={() => onNavigate(item.page)}
          >
            <Icon size={20} strokeWidth={current === item.page ? 2.2 : 1.6} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
