import React, { useState, useMemo } from 'react';
import {
  FileText,
  Camera,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Award,
  Layers,
  Search,
  Sparkles,
  Scissors,
  Bookmark,
  Printer,
} from 'lucide-react';
import { TranslationKeys } from '../../locales';
import { ActiveView, ShopRates, ShopServiceItem } from '../../types';

interface ServiceCatalogProps {
  t: TranslationKeys;
  rates?: ShopRates;
  services?: ShopServiceItem[];
  onSelectService: (serviceKey: string, targetView: ActiveView) => void;
}

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({ t, rates, services: customServices, onSelectService }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const services = useMemo(() => {
    // If shop owner defined custom services from their Desktop Workstation, display them!
    if (customServices && customServices.length > 0) {
      return customServices.map((cs) => {
        const cat = (cs.category || 'docs').toLowerCase();
        let icon = <FileText size={24} />;
        if (cat.includes('photo') || cs.title.toLowerCase().includes('photo')) icon = <Camera size={24} />;
        else if (cat.includes('bind') || cs.title.toLowerCase().includes('bind')) icon = <BookOpen size={24} />;
        else if (cat.includes('card') || cs.title.toLowerCase().includes('cert')) icon = <Award size={24} />;
        else if (cat.includes('nup') || cs.title.toLowerCase().includes('booklet')) icon = <Layers size={24} />;
        else if (cat.includes('finish') || cs.title.toLowerCase().includes('laminat')) icon = <Scissors size={24} />;

        return {
          id: cs.id,
          category: cat,
          title: cs.title,
          description: cs.description || '',
          icon,
          price: cs.priceDisplay,
          turnaround: cs.turnaround || 'Counter Service',
          badge: cs.badge,
          badgeColor: 'brand',
          features: cs.features && cs.features.length > 0 ? cs.features : ['Fast Counter Fulfillment', 'High-density print'],
          hasDiscount: !!cs.hasDiscount,
          discountNote: cs.discountNote,
          targetView: 'print' as ActiveView,
        };
      });
    }

    // Clean initial fallback without any hardcoded discounts
    const bwPrice = rates?.bwPerSideRupees ?? 1.5;
    const colorPrice = rates?.colorPerSideRupees ?? 10.0;
    const photoPrice = rates?.photoRate ?? 30.0;
    const staplePrice = rates?.stapleRate ?? 5.0;
    const spiralPrice = rates?.spiralRate ?? 40.0;
    const hardBoundPrice = rates?.hardBoundRate ?? 150.0;
    const cardPrice = rates?.cardRate ?? 15.0;
    const duplexDiscount = rates?.duplexDiscountPercent;

    return [
      {
        id: 'doc_print',
        category: 'docs',
        title: t.serviceDocPrintTitle,
        description: t.serviceDocPrintDesc,
        icon: <FileText size={24} />,
        price: `₹${bwPrice.toFixed(2)} / page`,
        turnaround: 'Instant Counter Print',
        badge: 'Most Popular',
        badgeColor: 'brand',
        features: [
          'A4, A3, Legal, Letter',
          `B&W (₹${bwPrice.toFixed(2)}) · Color (₹${colorPrice.toFixed(2)})`,
          'Single or Double-sided printing',
        ],
        hasDiscount: !!(duplexDiscount && duplexDiscount > 0),
        discountNote: duplexDiscount && duplexDiscount > 0 ? `Save ${duplexDiscount}% on 2-sided` : undefined,
        targetView: 'print' as ActiveView,
      },
      {
        id: 'photo_print',
        category: 'photo',
        title: t.servicePhotoTitle,
        description: t.servicePhotoDesc,
        icon: <Camera size={24} />,
        price: `₹${photoPrice.toFixed(2)} / 8-sheet`,
        turnaround: 'High Gloss Finish',
        badge: 'Studio Quality',
        badgeColor: 'amber',
        features: ['8-Up Passport Photo Grid', 'ID Card Front & Back on 1 page', '220 GSM Premium Glossy Card'],
        hasDiscount: false,
        discountNote: undefined,
        targetView: 'print' as ActiveView,
      },
      {
        id: 'binding_thesis',
        category: 'binding',
        title: t.serviceBindingTitle,
        description: t.serviceBindingDesc,
        icon: <BookOpen size={24} />,
        price: `From +₹${staplePrice.toFixed(2)}`,
        turnaround: '5–15 mins',
        badge: 'Thesis Grade',
        badgeColor: 'emerald',
        features: [
          `Corner Staple (+₹${staplePrice})`,
          `Spiral Coil with OHP Sheet (+₹${spiralPrice})`,
          `Executive Hard Bound (+₹${hardBoundPrice})`,
        ],
        hasDiscount: false,
        discountNote: undefined,
        targetView: 'print' as ActiveView,
      },
      {
        id: 'cert_print',
        category: 'docs',
        title: 'Certificates & Heavy Card',
        description: 'Crisp printing on 100 GSM Bond and 220 GSM Ivory cardstock for diplomas and official documents.',
        icon: <Award size={24} />,
        price: `From ₹${cardPrice.toFixed(2)}`,
        turnaround: 'Archival Grade',
        badge: 'Non-Smudge',
        badgeColor: 'emerald',
        features: ['220 GSM Heavy Ivory Card', 'High-density pigment toner', 'No ink bleed or smudge'],
        hasDiscount: false,
        discountNote: undefined,
        targetView: 'print' as ActiveView,
      },
      {
        id: 'nup_booklet',
        category: 'docs',
        title: 'Booklet & Study Handouts (N-Up)',
        description: 'Condense large syllabus, lecture slides, and notes into 2-up, 4-up, or 6-up handouts.',
        icon: <Layers size={24} />,
        price: 'Economical Multi-Page',
        turnaround: 'Paper Saver',
        badge: 'Student Favorite',
        badgeColor: 'brand',
        features: ['2 / 4 / 6 / 9 / 16 pages per sheet', 'Perfect for exam revision booklets', 'Automatic margin scaling'],
        hasDiscount: false,
        discountNote: undefined,
        targetView: 'print' as ActiveView,
      },
    ];
  }, [t, rates, customServices]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add('all');
    services.forEach((s) => set.add(s.category));

    const catLabels: Record<string, string> = {
      all: 'All Services',
      docs: 'Document Xerox',
      photo: 'Photo & ID',
      binding: 'Binding',
      finishing: 'Finishing',
      other: 'Specialty',
    };

    return Array.from(set).map((catId) => ({
      id: catId,
      label: catLabels[catId] || catId.charAt(0).toUpperCase() + catId.slice(1),
    }));
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
      const matchesQuery =
        !searchQuery.trim() ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesQuery;
    });
  }, [services, selectedCategory, searchQuery]);

  return (
    <section className="pb-services-section" aria-label="Print and Xerox Services">
      <div className="pb-section-header-compact">
        <div className="pb-section-title-wrap">
          <div className="pb-section-eyebrow">
            <Sparkles size={14} className="pb-sparkle-icon" />
            <span>COUNTER SERVICES &amp; PRICING</span>
          </div>
          <h2 className="pb-section-title">{t.servicesTitle}</h2>
          <p className="pb-section-subtitle">{t.servicesSubtitle}</p>
        </div>

        {/* Live Search Bar */}
        <div className="pb-service-search-box">
          <Search size={16} className="pb-search-icon" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Xerox, color, photo, binding..."
            aria-label="Search services"
            className="pb-service-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="pb-search-clear-btn"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="pb-category-pills-bar" role="tablist" aria-label="Service categories">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={selectedCategory === cat.id}
            className={`pb-cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="pb-services-grid">
        {filteredServices.map((item) => (
          <div
            key={item.id}
            className="pb-service-card"
            role="button"
            tabIndex={0}
            onClick={() => onSelectService(item.id, item.targetView)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectService(item.id, item.targetView);
              }
            }}
          >
            <div className="pb-service-card-top">
              <div className="pb-service-header-row">
                <div className="pb-service-icon-box">{item.icon}</div>
                {item.badge && (
                  <span className={`pb-service-badge pb-badge-${item.badgeColor || 'brand'}`}>
                    {item.badge}
                  </span>
                )}
              </div>

              <h3 className="pb-service-title">{item.title}</h3>
              <p className="pb-service-desc">{item.description}</p>

              {item.hasDiscount && item.discountNote && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 750,
                  color: '#15803d',
                  background: '#dcfce7',
                  border: '1px solid #bbf7d0',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  width: 'fit-content',
                }}>
                  🏷️ {item.discountNote}
                </div>
              )}

              <ul className="pb-service-feature-list">
                {item.features.map((feat, idx) => (
                  <li key={idx} className="pb-service-feature-item">
                    <CheckCircle2 size={14} className="pb-check-icon" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pb-service-card-footer">
              <div className="pb-service-meta">
                <span className="pb-service-price-tag">{item.price}</span>
                <span className="pb-service-turnaround">{item.turnaround}</span>
              </div>
              <div className="pb-service-arrow-btn" aria-hidden="true">
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        ))}

        {filteredServices.length === 0 && (
          <div className="pb-services-empty">
            <Search size={32} />
            <p>No printing services matched &quot;{searchQuery}&quot;</p>
            <button
              type="button"
              className="pb-btn-secondary"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};


