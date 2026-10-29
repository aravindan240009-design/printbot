import React from 'react';
import CustomerWebApp from '../customer-web/App';
import '../customer-web/index.css';

export interface CustomerShopPortalProps {
  shopId: string;
  onBackToHome?: () => void;
}

export const CustomerShopPortal: React.FC<CustomerShopPortalProps> = ({ shopId, onBackToHome }) => {
  return <CustomerWebApp initialShopId={shopId} onBackToHome={onBackToHome} />;
};
