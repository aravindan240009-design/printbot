import React from 'react';
import {
  Sparkles,
  PlusCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  Tag,
  Clock,
  Layers,
  Search,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { type ShopServiceItem } from '../App';

interface ServicesViewProps {
  shopServices: ShopServiceItem[];
  servicesCategoryFilter: string;
  setServicesCategoryFilter: (cat: string) => void;
  isPublishingServices: boolean;
  onOpenCreateServiceModal: () => void;
  onOpenEditServiceModal: (service: ShopServiceItem) => void;
  onDeleteService: (service: ShopServiceItem) => void;
  onPublishServices: (services: ShopServiceItem[]) => void;
  onLoadDefaultServices?: () => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  shopServices,
  servicesCategoryFilter,
  setServicesCategoryFilter,
  isPublishingServices,
  onOpenCreateServiceModal,
  onOpenEditServiceModal,
  onDeleteService,
  onPublishServices,
  onLoadDefaultServices,
}) => {
  const filteredServices = shopServices.filter(
    (s) => servicesCategoryFilter === 'all' || s.category === servicesCategoryFilter
  );

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'docs', label: 'Document Xerox' },
    { id: 'photo', label: 'Photo & ID' },
    { id: 'binding', label: 'Binding & Finishing' },
    { id: 'other', label: 'Specialty Services' },
  ];

  return (
    <div className="pb-view">
      {/* Page Header */}
      <div className="pb-page-header">
        <div>
          <span className="pb-page-eyebrow">COUNTER CATALOG &amp; PRICING</span>
          <h1 className="pb-page-title">Services &amp; Pricing Catalog</h1>
          <p className="pb-page-subtitle">
            Configure your shop's offerings, custom rates, turnaround times, and discount rules. All changes sync live to your customer upload website.
          </p>
        </div>

        <div className="pb-header-actions">
          <button
            type="button"
            className="pb-btn pb-btn-primary"
            onClick={onOpenCreateServiceModal}
          >
            <PlusCircle size={14} />
            <span>Add New Service</span>
          </button>

          <button
            type="button"
            className="pb-btn pb-btn-secondary"
            onClick={() => onPublishServices(shopServices)}
            disabled={isPublishingServices}
          >
            <CheckCircle2 size={14} color="var(--pb-desk-success)" />
            <span>{isPublishingServices ? 'Publishing...' : 'Publish to Customer Web'}</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Count Filter */}
      <div className="pb-services-toolbar">
        <div className="pb-filter-pills">
          {categories.map((cat) => {
            const count =
              cat.id === 'all'
                ? shopServices.length
                : shopServices.filter((s) => s.category === cat.id).length;
            const isActive = servicesCategoryFilter === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                className={`pb-pill-btn ${isActive ? 'active' : ''}`}
                onClick={() => setServicesCategoryFilter(cat.id)}
              >
                <span>{cat.label}</span>
                <span className="pb-pill-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="pb-services-count-indicator">
          <strong>{filteredServices.length}</strong> of {shopServices.length} services displayed
        </div>
      </div>

      {/* Services Cards Grid */}
      {filteredServices.length === 0 ? (
        <div className="pb-panel pb-empty-state" style={{ padding: '48px 24px' }}>
          <div className="pb-empty-icon">
            <Sparkles size={40} />
          </div>
          <h3 className="pb-empty-title">No Services in this Category</h3>
          <p className="pb-empty-subtitle">
            {shopServices.length === 0
              ? "Your counter service catalog is currently empty. Create your shop's first custom printing service or load standard starter services."
              : 'No services match this category filter. Select "All Services" or create a new one.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              className="pb-btn pb-btn-primary"
              onClick={onOpenCreateServiceModal}
            >
              <PlusCircle size={14} /> Add Service Now
            </button>
            {onLoadDefaultServices && (
              <button
                type="button"
                className="pb-btn pb-btn-secondary"
                onClick={onLoadDefaultServices}
              >
                Load Standard Starters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="pb-services-grid">
          {filteredServices.map((service) => (
            <div key={service.id} className="pb-service-card">
              {/* Card Header: Category & Badge */}
              <div className="pb-service-card-top">
                <span className="pb-service-category-tag">
                  {service.category === 'docs'
                    ? 'Document Xerox'
                    : service.category === 'photo'
                    ? 'Photo & ID'
                    : service.category === 'binding'
                    ? 'Binding'
                    : 'Specialty'}
                </span>
                {service.badge && (
                  <span className="pb-service-highlight-badge">
                    {service.badge}
                  </span>
                )}
              </div>

              {/* Title & Price */}
              <div className="pb-service-title-block">
                <h3 className="pb-service-title">{service.title}</h3>
                <div className="pb-service-price">{service.priceDisplay}</div>
              </div>

              {/* Description */}
              {service.description && (
                <p className="pb-service-desc">{service.description}</p>
              )}

              {/* Discount Tag (Only when customized and enabled) */}
              {service.hasDiscount && service.discountNote ? (
                <div className="pb-service-discount-badge">
                  <Tag size={12} />
                  <span>{service.discountNote}</span>
                </div>
              ) : (
                <div className="pb-service-no-discount">Standard Counter Rate</div>
              )}

              {/* Feature Bullets */}
              {service.features && service.features.length > 0 && (
                <ul className="pb-service-features-list">
                  {service.features.map((feat, i) => (
                    <li key={i} className="pb-service-feature-item">
                      <CheckCircle2 size={13} className="pb-feature-icon" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Footer: Turnaround & Action Buttons */}
              <div className="pb-service-card-footer">
                <span className="pb-service-turnaround">
                  <Clock size={11} style={{ display: 'inline', marginRight: '4px' }} />
                  {service.turnaround || 'Instant Counter Print'}
                </span>

                <div className="pb-service-card-actions">
                  <button
                    type="button"
                    className="pb-btn pb-btn-secondary pb-btn-sm"
                    onClick={() => onOpenEditServiceModal(service)}
                    title="Edit Service"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    className="pb-btn pb-btn-danger pb-btn-sm"
                    onClick={() => onDeleteService(service)}
                    title="Delete Service"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

