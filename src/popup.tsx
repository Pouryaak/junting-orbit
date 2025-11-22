import React, { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { Toaster } from "./components/ui/sonner"
import { CoverLetterTab } from "./components/CoverLetterTab"
import { ExtensionHeader } from "./components/ExtensionHeader"
import { Onboarding } from "./components/Onboarding"
import { SettingsTab } from "./components/SettingsTab"
import { SummaryTab } from "./components/SummaryTab"
import { HistoryTab } from "./components/HistoryTab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { getStoredData, saveStoredData } from "./lib/storage"
import { useAppData } from "./hooks/useAppData"
import "./styles/globals.css"

/**
 * Popup component for Junting Orbit extension
 * This is the main UI that appears when users click the extension icon
 */
function Popup() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const stored = await getStoredData();
        const hasCompleted = stored.hasCompletedOnboarding ?? false;
        
        // If user hasn't completed onboarding, show it
        if (!hasCompleted) {
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setShowOnboarding(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, []);

  const handleOnboardingComplete = async () => {
    const stored = await getStoredData();
    await saveStoredData({
      ...stored,
      hasCompletedOnboarding: true,
    });
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = async () => {
    const stored = await getStoredData();
    await saveStoredData({
      ...stored,
      hasCompletedOnboarding: true,
    });
    setShowOnboarding(false);
  };

  const { data: appData, updateData } = useAppData();

  // Show loading state while checking onboarding or initializing app data
  if (isChecking || !appData.isInitialized) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background min-w-[800px] min-h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Show onboarding for first-time users
  if (showOnboarding) {
    return (
      <div className="w-full h-full flex flex-col bg-background min-w-[800px] min-h-[600px]">
        <ExtensionHeader />
        <div className="flex-1 overflow-y-auto">
          <Onboarding onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />
        </div>
        <Toaster />
      </div>
    );
  }

  // Show main UI with tabs
  return (
    <div className="w-full h-full flex flex-col bg-background min-w-[800px]">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0">
        <ExtensionHeader />
      </div>
      
      {/* Main Content with Tabs - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-background">
        <div className="p-6">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="w-full h-14 grid grid-cols-4 mb-6 bg-muted rounded-lg p-1.5 gap-1">
              <TabsTrigger 
                value="summary" 
                className="text-sm font-semibold rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all hover:bg-background/50"
              >
                Summary
              </TabsTrigger>
              <TabsTrigger 
                value="cover-letter" 
                className="text-sm font-semibold rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all hover:bg-background/50"
              >
                Cover Letter
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="text-sm font-semibold rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all hover:bg-background/50"
              >
                History
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="text-sm font-semibold rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all hover:bg-background/50"
              >
                Profile
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="mt-0 focus-visible:outline-none space-y-6">
              <SummaryTab appData={appData} onUpdateData={updateData} />
            </TabsContent>
            
            <TabsContent value="cover-letter" className="mt-0 focus-visible:outline-none">
              <CoverLetterTab />
            </TabsContent>

            <TabsContent value="history" className="mt-0 focus-visible:outline-none">
              <HistoryTab />
            </TabsContent>
            
            <TabsContent value="settings" className="mt-0 focus-visible:outline-none">
              <SettingsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Toaster />
    </div>
  )
}

// Initialize React app
const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  )
}
