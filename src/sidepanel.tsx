import React, { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { Toaster } from "./components/ui/sonner"
import { CoverLetterTab } from "./components/CoverLetterTab"
import { ExtensionHeader } from "./components/ExtensionHeader"
import { Onboarding } from "./components/Onboarding"
import { SettingsTab } from "./components/SettingsTab"
import { SummaryTab } from "./components/SummaryTab"
import { HistoryTab } from "./components/HistoryTab"
import { ScanTab } from "./components/ScanTab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { getStoredData, saveStoredData } from "./lib/storage"
import { useAppData } from "./hooks/useAppData"
import "./styles/globals.css"

/**
 * SidePanel component for Junting Orbit extension
 * This is the main UI that appears in the Chrome Side Panel
 */
import { RadialMenu, RadialMenuItem } from "./components/RadialMenu"
import { UsageIndicator } from "./components/summary/UsageIndicator"
import { FileText, History, Settings, LayoutDashboard, Search } from "lucide-react"

/**
 * SidePanel component for Junting Orbit extension
 * This is the main UI that appears in the Chrome Side Panel
 */
function SidePanel() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const { data: appData, updateData } = useAppData();
  const { rateLimitState } = appData;
  const isQuotaDepleted = rateLimitState.remaining !== null && rateLimitState.remaining <= 0;

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

  // Show loading state while checking onboarding or initializing app data
  if (isChecking || !appData.isInitialized) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Show onboarding for first-time users
  if (showOnboarding) {
    return (
      <div className="w-full h-full flex flex-col bg-background min-h-screen">
        <ExtensionHeader />
        <div className="flex-1 overflow-y-auto">
          <Onboarding onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />
        </div>
        <Toaster />
      </div>
    );
  }

  const menuItems: RadialMenuItem[] = [
    { id: "summary", value: "summary", label: "Summary", icon: LayoutDashboard },
    { id: "cover-letter", value: "cover-letter", label: "Cover Letter", icon: FileText },
    { id: "scan", value: "scan", label: "Scan", icon: Search },
    { id: "history", value: "history", label: "History", icon: History },
    { id: "settings", value: "settings", label: "Settings", icon: Settings },
  ];

  // Show main UI with tabs
  return (
    <div className="w-full h-full flex flex-col bg-background min-h-screen relative">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0">
        <ExtensionHeader />
      </div>
      
      {/* Main Content with Tabs - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-background pb-5">
        <div className="p-4">


          {/* Radial Menu & Usage - Visible on small screens (< 590px) */}
          <div className="mb-6 min-[590px]:hidden sticky -top-4 z-50 py-2 bg-background/80 backdrop-blur-sm -mx-4 px-4 border-b border-border/40 flex items-center justify-between">
            <RadialMenu 
              items={menuItems} 
              activeValue={activeTab} 
              onValueChange={setActiveTab} 
            />
            
            {/* Usage Indicator in Sticky Header */}
            <div className="mr-2">
              <UsageIndicator 
                usagePlan={rateLimitState.plan}
                usageLimit={rateLimitState.limit}
                usageRemaining={rateLimitState.remaining}
                isQuotaDepleted={isQuotaDepleted}
                compact={true}
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

            {/* TabsList - Hidden on small screens (< 590px) */}
            <TabsList className="w-full h-auto flex flex-wrap mb-6 bg-muted rounded-lg p-1.5 gap-1 hidden min-[590px]:flex">
              <TabsTrigger 
                value="summary" 
                className="flex-1 text-sm font-semibold rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all hover:bg-background/50"
              >
                Summary
              </TabsTrigger>
              <TabsTrigger 
                value="cover-letter" 
                className="flex-1 text-sm font-semibold rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all hover:bg-background/50"
              >
                Cover Letter
              </TabsTrigger>
              <TabsTrigger 
                value="scan" 
                className="flex-1 text-sm font-semibold rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all hover:bg-background/50"
              >
                Scan
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex-1 text-sm font-semibold rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all hover:bg-background/50"
              >
                History
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex-1 text-sm font-semibold rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all hover:bg-background/50"
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

            <TabsContent value="scan" className="mt-0 focus-visible:outline-none">
              <ScanTab />
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
      <SidePanel />
    </React.StrictMode>
  )
}
