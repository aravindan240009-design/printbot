import React from 'react';
import CustomerWebApp from '@xerox/customer-web';
import '@xerox/customer-web/css';

export interface CustomerShopPortalProps {
  shopId: string;
  onBackToHome?: () => void;
}

export const CustomerShopPortal: React.FC<CustomerShopPortalProps> = ({ shopId, onBackToHome }) => {
  return <CustomerWebApp initialShopId={shopId} onBackToHome={onBackToHome} />;
};
