import React from 'react';
import CustomerWebApp from '../../apps/customer-web/src/App';
import '../../apps/customer-web/src/index.css';

export interface CustomerShopPortalProps {
  shopId: string;
  onBackToHome?: () => void;
}

export const CustomerShopPortal: React.FC<CustomerShopPortalProps> = ({ shopId, onBackToHome }) => {
  return <CustomerWebApp initialShopId={shopId} onBackToHome={onBackToHome} />;
};
