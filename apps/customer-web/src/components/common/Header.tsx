import React from 'react';
import { Printer, Globe, ShoppingBag } from 'lucide-react';
import { Language, ShopSession, ActiveView } from '../../types';
import { TranslationKeys } from '../../locales';

interface HeaderProps {
  session: ShopSession;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  cartCount: number;
  t: TranslationKeys;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  lang,
  onLanguageChange,
  activeView,
  onNavigate,
  cartCount,
  t,
}) => {
  return (
    <header className="pb-top-header" role="banner">
      <div className="pb-container">
        <div className="pb-header-inner">
          {/* Brand & Shop identity */}
          <button
            className="pb-header-brand"
            onClick={() => onNavigate('home')}
            aria-label={`${t.brandName} - ${session.shop_name || 'Print Counter'} - ${t.navHome}`}
            type="button"
          >
            <div className="pb-brand-logo-badge" aria-hidden="true">
              <Printer size={20} />
            </div>
            <div className="pb-brand-titles">
              <span className="pb-brand-name">{t.brandName}</span>
              <span className="pb-brand-shop-name" title={session.shop_name}>
                {session.shop_name || 'Print Bot Workstation'}
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="pb-header-nav-links" aria-label="Main Navigation">
            <button
              type="button"
              className={`pb-nav-btn ${activeView === 'home' ? 'active' : ''}`}
              onClick={() => onNavigate('home')}
            >
              {t.navHome}
            </button>
            <button
              type="button"
              className={`pb-nav-btn ${activeView === 'print' ? 'active' : ''}`}
              onClick={() => onNavigate('print')}
            >
              {t.navPrint}
            </button>
            <button
              type="button"
              className={`pb-nav-btn ${activeView === 'services' ? 'active' : ''}`}
              onClick={() => onNavigate('services')}
            >
              {t.navServices}
            </button>
            <button
              type="button"
              className={`pb-nav-btn ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => onNavigate('dashboard')}
            >
              {t.navOrders}
            </button>
          </nav>

          {/* Action Tools: Lang, Cart */}
          <div className="pb-header-actions">
            {/* Language Switcher */}
            <div className="pb-lang-select-wrapper">
              <select
                className="pb-lang-select"
                value={lang}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                aria-label={t.language}
              >
                <option value="en">English</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
              <Globe size={14} className="pb-lang-icon" aria-hidden="true" />
            </div>

            {/* Cart Trigger */}
            <button
              type="button"
              className={`pb-cart-indicator-btn ${activeView === 'cart' ? 'active' : ''}`}
              onClick={() => onNavigate('cart')}
              aria-label={`${t.navCart}: ${cartCount} items`}
              title={t.navCart}
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && <span className="pb-cart-badge-count">{cartCount}</span>}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
