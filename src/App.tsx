import React, { useState, useEffect } from 'react';
import CustomerWebApp from './customer-web/App';
import './customer-web/index.css';
import { resolveShopSlugFromUrl } from './customer-web/utils/tenant';

export const App: React.FC = () => {
  const [shopId, setShopId] = useState<string>(() => resolveShopSlugFromUrl() || 'test1');

  useEffect(() => {
    const handlePopState = () => {
      setShopId(resolveShopSlugFromUrl() || 'test1');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return <CustomerWebApp initialShopId={shopId} />;
};

export default App;
