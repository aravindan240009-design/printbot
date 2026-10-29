import React from 'react';
export interface CardProps { children: React.ReactNode; className?: string; title?: string; subtitle?: string; }
export const Card: React.FC<CardProps> = ({ children, className = '', title, subtitle }) => <div className={`pb-panel ${className}`}>{(title || subtitle) && <div className="pb-panel-header">{title && <h3 className="pb-panel-title">{title}</h3>}{subtitle && <p className="pb-panel-subtitle">{subtitle}</p>}</div>}<div className="pb-panel-body">{children}</div></div>;
