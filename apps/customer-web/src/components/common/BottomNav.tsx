import React from 'react';
import { Home, Printer, Layers, ShoppingBag, Clock } from 'lucide-react';
import { ActiveView } from '../../types';
import { TranslationKeys } from '../../locales';

interface BottomNavProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  cartCount: number;
  t: TranslationKeys;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeView,
  onNavigate,
  cartCount,
  t,
}) => {
  return (
    <nav className="pb-bottom-nav" aria-label="Mobile Navigation">
      <button
        className={`pb-bottom-nav-item ${activeView === 'home' ? 'active' : ''}`}
        onClick={() => onNavigate('home')}
      >
        <Home size={20} />
        <span>{t.navHome}</span>
      </button>

      <button
        className={`pb-bottom-nav-item ${activeView === 'print' ? 'active' : ''}`}
        onClick={() => onNavigate('print')}
      >
        <Printer size={20} />
        <span>{t.navPrint}</span>
      </button>

      <button
        className={`pb-bottom-nav-item ${activeView === 'services' ? 'active' : ''}`}
        onClick={() => onNavigate('services')}
      >
        <Layers size={20} />
        <span>{t.navServices}</span>
      </button>

      <button
        className={`pb-bottom-nav-item ${activeView === 'timed_booking' ? 'active' : ''}`}
        onClick={() => onNavigate('timed_booking')}
      >
        <Clock size={20} />
        <span>{t.navBookSlot}</span>
      </button>

      <button
        className={`pb-bottom-nav-item ${activeView === 'cart' ? 'active' : ''}`}
        onClick={() => onNavigate('cart')}
      >
        <ShoppingBag size={20} />
        <span>{t.navCart}</span>
        {cartCount > 0 && <span className="pb-bottom-nav-badge" />}
      </button>
    </nav>
  );
};
