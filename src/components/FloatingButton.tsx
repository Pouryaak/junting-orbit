/// <reference types="chrome" />
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { CoverLetterTab } from './CoverLetterTab';
import { ExtensionHeader } from './ExtensionHeader';
import { SettingsTab } from './SettingsTab';
import { SummaryTab } from './SummaryTab';
import { Sheet, SheetContent } from './ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface FloatingButtonProps {
  className?: string;
}

/**
 * FloatingButton component that appears on the page
 * When clicked, opens a slider panel from the right side
 */
export const FloatingButton: React.FC<FloatingButtonProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const logoUrl = chrome.runtime.getURL('logo.png');

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed top-6 right-6 z-[9998] h-16 w-16",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "transition-all duration-300 hover:scale-110 active:scale-95",
            "shadow-2xl hover:shadow-primary/50",
            "flex items-center justify-center",
            "rounded-lg", // Cube shape (square with rounded corners)
            className
          )}
          aria-label="Open Junting Orbit"
          style={{
            boxShadow: '0 10px 25px -5px rgba(44, 58, 138, 0.4), 0 0 0 1px rgba(44, 58, 138, 0.1)',
          }}
        >
          <img 
            src={logoUrl} 
            alt="Junting Orbit" 
            className="h-12 w-12 object-contain"
          />
        </button>
      )}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto p-0">
          <ExtensionHeader />
          
          <div className="p-6">
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="w-full h-15 grid grid-cols-3 relative z-20">
                <TabsTrigger value="summary" className="relative z-20">Summary</TabsTrigger>
                <TabsTrigger value="cover-letter" className="relative z-20">Cover Letter</TabsTrigger>
                <TabsTrigger value="settings" className="relative z-20">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="mt-6">
                <SummaryTab />
              </TabsContent>
              
              <TabsContent value="cover-letter" className="mt-6">
                <CoverLetterTab />
              </TabsContent>
              
              <TabsContent value="settings" className="mt-6">
                <SettingsTab />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

