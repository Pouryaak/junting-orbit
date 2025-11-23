/// <reference types="chrome" />
import React from 'react';
import { FeedbackDialog } from './FeedbackDialog';

export const ExtensionHeader: React.FC = () => {
  const logoUrl = chrome.runtime.getURL('logo.png');
  
  return (
    <div className="w-full bg-primary text-primary-foreground px-6 py-1 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <FeedbackDialog />
      </div>
      <div className="flex items-center">
        <img src={logoUrl} alt="Junting Orbit" className="h-12 w-12 object-contain" />
      </div>
    </div>
  );
};

