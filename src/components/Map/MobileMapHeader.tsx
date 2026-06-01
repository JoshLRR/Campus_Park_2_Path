import React from 'react';

export function MobileMapHeader({onMenuOpen}: {onMenuOpen: () => void}) {
  return (
    <div className="absolute left-0 right-0 top-0 z-30 overflow-hidden" style={{height: 64}}>
      <div className="absolute inset-0 bg-[#2563EB] shadow-[0px_2px_48px_0px_rgba(0,0,0,0.13)]" />
      <button
        onClick={onMenuOpen}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 -m-2"
        aria-label="Open room list"
      >
        <svg width="20" height="14" fill="none" viewBox="0 0 20 14">
          <path d="M1 7H19" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M1 1H19" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M1 13H19" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      </button>
      <p className="absolute inset-0 flex items-center justify-center text-white text-base font-semibold tracking-[0.864px]">
        Campus Map
      </p>
    </div>
  );
}
