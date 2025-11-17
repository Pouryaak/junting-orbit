import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from './ui/button';

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

