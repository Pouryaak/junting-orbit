import React, { useState, useEffect } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
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

  const handleDownloadPDF = async () => {
    try {
      // Get user profile for personalization
      const stored = await getStoredData();
      const userName = stored.userProfile?.full_name || 'Your Name';
      
      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Set font
      doc.setFont('helvetica');

      // Add header with name (if available)
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(userName, 20, 20);

      // Add date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const today = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(today, 20, 28);

      // Add cover letter content
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      // Split text to fit page width (170mm with 20mm margins on each side)
      const lines = doc.splitTextToSize(coverLetter, 170);
      
      // Add text with proper line spacing
      let yPosition = 45; // Start position
      const lineHeight = 6; // Line spacing
      const pageHeight = 280; // A4 height minus margins
      
      for (let i = 0; i < lines.length; i++) {
        // Check if we need a new page
        if (yPosition > pageHeight) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(lines[i], 20, yPosition);
        yPosition += lineHeight;
      }

      // Generate filename with date
      const filename = `cover-letter-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Save the PDF
      doc.save(filename);
      
      // Show success message
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Cover Letter</h3>
        <div className="flex gap-2">
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
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>
      
      <textarea
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        onBlur={(e) => {
          // Ensure tabs remain clickable after textarea loses focus
          e.currentTarget.style.pointerEvents = 'auto';
        }}
        className="w-full h-[60vh] p-4 rounded-lg border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 relative z-0"
        placeholder="Your AI-generated cover letter will appear here..."
        style={{ pointerEvents: 'auto' }}
      />
      
      <p className="text-sm text-muted-foreground">
        Edit the cover letter as needed, then copy or download as PDF to use in your application.
      </p>
    </div>
  );
};

