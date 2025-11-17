/// <reference types="chrome" />
import React from 'react';

export const ExtensionHeader: React.FC = () => {
  const logoUrl = chrome.runtime.getURL('logo.png');
  
  return (
    <div className="w-full bg-primary text-primary-foreground px-6 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold text-primary-foreground">Junting Orbit</h1>
      </div>
      <div className="flex items-center">
        <img src={logoUrl} alt="Junting Orbit" className="h-14 w-14 object-contain" />
      </div>
    </div>
  );
};

