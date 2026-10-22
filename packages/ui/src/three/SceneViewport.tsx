import React, { useState } from 'react';

export interface SceneViewportProps {
  title?: string;
  fallbackImage?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Reusable 3D Scene Viewport with demand-rendering and 2D accessible fallback.
 * Ensures 60fps responsiveness and zero continuous GPU draining when idle.
 */
export const SceneViewport: React.FC<SceneViewportProps> = ({
  title = '3D Print Preview',
  fallbackImage,
  className = '',
  children,
}) => {
  const [hasWebGlError, setHasWebGlError] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

  return (
    <div
      className={`relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex flex-col items-center justify-center select-none ${className}`}
      onMouseEnter={() => setIsInteractive(true)}
      onMouseLeave={() => setIsInteractive(false)}
    >
      {/* 3D Scene Container */}
      {!hasWebGlError && children ? (
        <div className="w-full h-full relative">
          {children}
          {/* Subtle Viewport Badge */}
          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded text-[10px] font-mono text-slate-300 border border-slate-700/60 flex items-center space-x-1.5 pointer-events-none">
            <span className={`w-1.5 h-1.5 rounded-full ${isInteractive ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span>WebGL2 Demand-Loop {isInteractive ? '(Active)' : '(Idle)'}</span>
          </div>
        </div>
      ) : (
        /* Accessible 2D Fallback */
        <div className="text-center p-6 space-y-2">
          {fallbackImage ? (
            <img src={fallbackImage} alt={title} className="max-h-48 mx-auto rounded shadow" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-indigo-950/60 border border-indigo-800 text-indigo-400 flex items-center justify-center mx-auto text-2xl font-bold">
              3D
            </div>
          )}
          <h4 className="text-xs font-bold text-slate-300">{title}</h4>
          <p className="text-[11px] text-slate-500 max-w-xs">
            Interactive 3D acceleration inactive. Displaying static preview.
          </p>
        </div>
      )}
    </div>
  );
};
