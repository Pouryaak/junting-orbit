import React, { useState, useEffect } from "react";
import { Search, MapPin, Briefcase, Check } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { getStoredData, saveStoredData } from "@/lib/storage";
import { toast } from "sonner";

const JOB_BOARDS = [
  { id: "linkedin", label: "LinkedIn", short: "Li", color: "bg-[#0077B5]" },
  { id: "indeed", label: "Indeed", short: "In", color: "bg-[#2164f3]" },
  { id: "seek", label: "Seek", short: "Sk", color: "bg-[#E60278]" },
  { id: "thehub", label: "The Hub", short: "Hub", color: "bg-[#00D084]" },
];

export const ScanTab: React.FC = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [selectedBoards, setSelectedBoards] = useState<string[]>(["linkedin", "indeed", "seek"]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const data = await getStoredData();
        if (data.scanPreferences) {
          setJobTitle(data.scanPreferences.jobTitle);
          setLocation(data.scanPreferences.location);
          setSelectedBoards(data.scanPreferences.selectedBoards);
        }
      } catch (error) {
        console.error("Failed to load scan preferences", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPreferences();
  }, []);

  const toggleBoard = (boardId: string) => {
    setSelectedBoards((prev) =>
      prev.includes(boardId)
        ? prev.filter((id) => id !== boardId)
        : [...prev, boardId]
    );
  };

  const buildUrl = (boardId: string, title: string, loc: string) => {
    const encodedTitle = encodeURIComponent(title);
    const encodedLocation = encodeURIComponent(loc);

    switch (boardId) {
      case "linkedin":
        return `https://www.linkedin.com/jobs/search/?keywords=${encodedTitle}&location=${encodedLocation}`;
      case "indeed":
        // Default to .com, could be improved with region selection later
        return `https://www.indeed.com/jobs?q=${encodedTitle}&l=${encodedLocation}`;
      case "seek":
        // Slugify: lowercase, trim, replace spaces with dashes
        const titleSlug = title.trim().toLowerCase().replace(/\s+/g, "-");
        const locationSlug = loc.trim().toLowerCase().replace(/\s+/g, "-");
        return `https://www.seek.com.au/${encodeURIComponent(titleSlug)}-jobs/in-${encodeURIComponent(locationSlug)}`;
      case "thehub":
        return `https://thehub.io/jobs?search=${encodedTitle}&location=${encodedLocation}`;
      default:
        return "";
    }
  };

  const handleSearch = async () => {
    if (!jobTitle.trim()) {
      toast.error("Please enter a job title");
      return;
    }
    if (selectedBoards.length === 0) {
      toast.error("Please select at least one job board");
      return;
    }

    // Save preferences
    try {
      const currentData = await getStoredData();
      await saveStoredData({
        ...currentData,
        scanPreferences: {
          jobTitle,
          location,
          selectedBoards,
        },
      });
    } catch (error) {
      console.error("Failed to save scan preferences", error);
    }

    // Open tabs
    let openedCount = 0;
    selectedBoards.forEach((boardId) => {
      const url = buildUrl(boardId, jobTitle, location);
      if (url) {
        chrome.tabs.create({ url, active: false });
        openedCount++;
      }
    });

    toast.success(`Launched ${openedCount} searches! 🚀`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Orbit Scan 📡</h2>
        <p className="text-muted-foreground">
          Search multiple job boards in one orbit.
        </p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-6 space-y-6">
          {/* Inputs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Senior Frontend Engineer"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-[0.8rem] text-muted-foreground">
                Use level keywords too, like "Senior", "Lead", or "Mid-level".
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Remote · Europe"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Job Boards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-none">Job boards</label>
              <span className="text-xs text-muted-foreground">
                {selectedBoards.length} selected
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {JOB_BOARDS.map((board) => {
                const isSelected = selectedBoards.includes(board.id);
                return (
                  <button
                    key={board.id}
                    onClick={() => toggleBoard(board.id)}
                    className={cn(
                      "relative flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:bg-accent",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "bg-background text-muted-foreground hover:text-accent-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm",
                        board.color,
                        !isSelected && "opacity-50 grayscale"
                      )}
                    >
                      {board.short}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-sm font-medium truncate", isSelected && "text-foreground")}>
                        {board.label}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute right-2 top-2 text-primary">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[0.8rem] text-muted-foreground">
              Don't spray and pray. Focus on boards that match your profile.
            </p>
          </div>

          {/* Action */}
          <div className="pt-2 flex items-center gap-4">
            <div className="text-xs text-muted-foreground hidden sm:block">
              {selectedBoards.length} boards ready
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={!jobTitle.trim() || selectedBoards.length === 0}
              className="flex-1"
            >
              <Search className="mr-2 h-4 w-4" />
              Search {selectedBoards.length} boards
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
