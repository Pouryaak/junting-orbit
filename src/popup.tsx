import React from "react"
import { createRoot } from "react-dom/client"
import { CoverLetterTab } from "./components/CoverLetterTab"
import { ExtensionHeader } from "./components/ExtensionHeader"
import { SettingsTab } from "./components/SettingsTab"
import { SummaryTab } from "./components/SummaryTab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import "./styles/globals.css"

/**
 * Popup component for Junting Orbit extension
 * This is the main UI that appears when users click the extension icon
 */
function Popup() {
  return (
    <div className="w-full h-full flex flex-col bg-background min-w-[500px]">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0">
        <ExtensionHeader />
      </div>
      
      {/* Main Content with Tabs - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-background">
        <div className="p-6">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="w-full h-14 grid grid-cols-3 mb-6 bg-muted rounded-lg p-1.5 gap-1">
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
                value="settings" 
                className="text-sm font-semibold rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all hover:bg-background/50"
              >
                Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="mt-0 focus-visible:outline-none space-y-6">
              <SummaryTab />
            </TabsContent>
            
            <TabsContent value="cover-letter" className="mt-0 focus-visible:outline-none">
              <CoverLetterTab />
            </TabsContent>
            
            <TabsContent value="settings" className="mt-0 focus-visible:outline-none">
              <SettingsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
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
