import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { getStoredData, saveStoredData } from '@/lib/storage';

// Mock cover letter - will be replaced with AI-generated content later
const mockCoverLetter = `Dear Hiring Manager,

I am writing to express my strong interest in the [Position Title] role at [Company Name]. With my background in [relevant experience], I am excited about the opportunity to contribute to your team.

[AI-generated personalized content will appear here based on job description and resume]

Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experience align with your needs.

Best regards,
[Your Name]`;

export const CoverLetterTab: React.FC = () => {
  const [coverLetter, setCoverLetter] = useState(mockCoverLetter);
  const [copied, setCopied] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use mockCoverLetter as fallback if no stored data
  const [hasStoredData, setHasStoredData] = useState(false);

  // Load stored cover letter on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await getStoredData();
        if (stored.coverLetter) {
          setCoverLetter(stored.coverLetter);
          setHasStoredData(true);
        } else {
          // Use mock if no stored data
          setCoverLetter(mockCoverLetter);
          setHasStoredData(false);
        }
      } catch (error) {
        // Silently fail on load - use mock as fallback
        console.error('Error loading stored cover letter:', error);
        setCoverLetter(mockCoverLetter);
        setHasStoredData(false);
      } finally {
        setIsInitialized(true);
      }
    };

    loadData();

    // Listen for cover letter updates from SummaryTab
    const handleUpdate = (event: CustomEvent) => {
      if (event.detail?.coverLetter) {
        setCoverLetter(event.detail.coverLetter);
        setHasStoredData(true);
      }
    };

    window.addEventListener('coverLetterUpdated', handleUpdate as EventListener);
    return () => {
      window.removeEventListener('coverLetterUpdated', handleUpdate as EventListener);
    };
  }, []);

  // Save cover letter to storage when it changes (debounced)
  // Only save if user has edited it (not the initial mock)
  useEffect(() => {
    if (!isInitialized) return;
    // Don't save if it's still the mock and we haven't loaded stored data
    if (!hasStoredData && coverLetter === mockCoverLetter) return;

    const timeoutId = setTimeout(async () => {
      try {
        const stored = await getStoredData();
        await saveStoredData({
          ...stored,
          coverLetter: coverLetter || null,
        });
        setHasStoredData(true);
      } catch (error) {
        // Log error but don't interrupt user experience
        console.error('Error saving cover letter:', error);
        // Could show a subtle notification here in the future
      }
    }, 500); // Debounce: save 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [coverLetter, isInitialized, hasStoredData]);

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Cover Letter</h3>
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </div>
      
      <textarea
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        onBlur={(e) => {
          // Ensure tabs remain clickable after textarea loses focus
          e.currentTarget.style.pointerEvents = 'auto';
        }}
        className="w-full min-h-[400px] p-4 rounded-lg border bg-background text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 relative z-0"
        placeholder="Your AI-generated cover letter will appear here..."
        style={{ pointerEvents: 'auto' }}
      />
      
      <p className="text-sm text-muted-foreground">
        Edit the cover letter as needed, then copy it to use in your application.
      </p>
    </div>
  );
};

