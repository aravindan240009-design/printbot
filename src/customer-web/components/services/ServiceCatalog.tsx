import React, { useState, useMemo } from 'react';
import {
  FileText,
  Camera,
  BookOpen,
  Clock,
  ArrowRight,
  CheckCircle2,
  Award,
  Layers,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { TranslationKeys } from '../../locales';
import { ActiveView, ShopRates } from '../../types';

interface ServiceCatalogProps {
  t: TranslationKeys;
  rates?: ShopRates;
  onSelectService: (serviceKey: string, targetView: ActiveView) => void;
}

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({ t, rates, onSelectService }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const services = useMemo(
    () => [
      {
        id: 'doc_print',
        category: 'docs',
        title: t.serviceDocPrintTitle,
        description: t.serviceDocPrintDesc,
        icon: <FileText size={24} />,
        price: `₹${(rates?.bwPerSideRupees ?? 1.5).toFixed(2)} / page`,
        turnaround: 'Instant Counter Print',
        badge: 'Most Popular',
        badgeColor: 'brand',
        features: [
          'A4, A3, Legal, Letter',
          'Black & White or Color',
          `Single or Double-sided (Save ${rates?.duplexDiscountPercent ?? 15}%)`,
        ],
        targetView: 'print' as ActiveView,
      },
      {
        id: 'photo_print',
        category: 'photo',
        title: t.servicePhotoTitle,
        description: t.servicePhotoDesc,
        icon: <Camera size={24} />,
        price: '₹30.00 / 8-sheet',
        turnaround: 'High Gloss Finish',
        badge: 'Studio Quality',
        badgeColor: 'amber',
        features: ['8-Up Passport Photo Grid', 'ID Card Front & Back on 1 page', '220 GSM Premium Glossy Card'],
        targetView: 'print' as ActiveView,
      },
      {
        id: 'binding_thesis',
        category: 'binding',
        title: t.serviceBindingTitle,
        description: t.serviceBindingDesc,
        icon: <BookOpen size={24} />,
        price: 'From +₹5.00',
        turnaround: '5–15 mins',
        badge: 'Thesis Grade',
        badgeColor: 'emerald',
        features: ['Corner Staple (+₹5)', 'Spiral Coil with OHP Sheet (+₹40)', 'Executive Hard Bound (+₹150)'],
        targetView: 'print' as ActiveView,
      },
      {
        id: 'timed_xerox',
        category: 'timed',
        title: t.serviceTimedTitle,
        description: t.serviceTimedDesc,
        icon: <Clock size={24} />,
        price: 'Zero Waiting',
        turnaround: 'Reserved Slot',
        badge: 'Skip The Queue',
        badgeColor: 'cyan',
        features: ['Assisted Counter Xerox', 'Dedicated Copier Reservation', 'Priority Rush Dispatch'],
        targetView: 'timed_booking' as ActiveView,
      },
      {
        id: 'cert_print',
        category: 'docs',
        title: 'Certificates & Heavy Card',
        description: 'Crisp printing on 100 GSM Bond and 220 GSM Ivory cardstock for diplomas and official documents.',
        icon: <Award size={24} />,
        price: 'From ₹15.00',
        turnaround: 'Archival Grade',
        badge: 'Non-Smudge',
        badgeColor: 'emerald',
        features: ['220 GSM Heavy Ivory Card', 'High-density pigment toner', 'No ink bleed or smudge'],
        targetView: 'print' as ActiveView,
      },
      {
        id: 'nup_booklet',
        category: 'docs',
        title: 'Booklet & Study Handouts (N-Up)',
        description: 'Condense large syllabus, lecture slides, and notes into 2-up, 4-up, or 6-up handouts.',
        icon: <Layers size={24} />,
        price: 'Save up to 60%',
        turnaround: 'Paper Saver',
        badge: 'Student Favorite',
        badgeColor: 'brand',
        features: ['2 / 4 / 6 / 9 / 16 pages per sheet', 'Perfect for exam revision booklets', 'Automatic margin scaling'],
        targetView: 'print' as ActiveView,
      },
    ],
    [t]
  );

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'docs', label: 'Document Xerox' },
    { id: 'photo', label: 'Photo & ID' },
    { id: 'binding', label: 'Binding' },
    { id: 'timed', label: 'Timed Counter Slot' },
  ];

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
                  <span className={`pb-service-badge pb-badge-${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </div>

              <h3 className="pb-service-title">{item.title}</h3>
              <p className="pb-service-desc">{item.description}</p>

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

