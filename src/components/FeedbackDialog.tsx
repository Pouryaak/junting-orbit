/**
 * Feedback Dialog Component
 * Allows users to submit bug reports or feature requests from the popup header
 */

import React, { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { submitFeedback, type FeedbackCategory } from "@/services/apiService";
import { getCurrentTabUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const FeedbackDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackCategory>("bug");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const fetchCurrentUrl = async () => {
      try {
        const url = await getCurrentTabUrl();
        if (url) {
          setPageUrl((prev) => prev || url);
        }
      } catch (error) {
        console.error("Failed to load current tab URL for feedback", error);
      }
    };

    fetchCurrentUrl();
  }, [open]);

  const resetForm = () => {
    setFeedbackType("bug");
    setTitle("");
    setMessage("");
    setIsSubmitting(false);
    setPageUrl("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await submitFeedback({
        type: feedbackType,
        title,
        message,
        pageUrl: pageUrl || undefined,
      });

      toast.success("Thanks for the feedback! We'll review it shortly.");
      resetForm();
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit feedback. Please try again.";
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="bg-white/10 text-primary-foreground hover:bg-white/20"
        >
          <MessageSquare className="h-4 w-4" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center text-xl">Tell Me What You Think</DialogTitle>
          <DialogDescription className="text-center pt-2">
            I'm a one-person crew pulling overtime to make Junting Orbit magical. Send
            your bugs, dreams, and spicy takes! 🙌
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                What kind of note is this?
              </label>
              <div className="flex gap-2">
                <label className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-md border p-2 text-sm font-medium transition-all cursor-pointer hover:bg-muted",
                  feedbackType === "bug" ? "border-primary bg-primary/5 text-primary" : "bg-background"
                )}>
                  <input
                    type="radio"
                    name="feedback-type"
                    value="bug"
                    checked={feedbackType === "bug"}
                    onChange={() => setFeedbackType("bug")}
                    className="sr-only"
                  />
                  🐛 Bug Report
                </label>
                <label className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-md border p-2 text-sm font-medium transition-all cursor-pointer hover:bg-muted",
                  feedbackType === "feature" ? "border-primary bg-primary/5 text-primary" : "bg-background"
                )}>
                  <input
                    type="radio"
                    name="feedback-type"
                    value="feature"
                    checked={feedbackType === "feature"}
                    onChange={() => setFeedbackType("feature")}
                    className="sr-only"
                  />
                  🌟 Feature Idea
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="feedback-title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Short title
              </label>
              <input
                id="feedback-title"
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={feedbackType === "bug" ? "Broken apply button..." : "Add support for..."}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="feedback-message" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                What’s on your mind?
              </label>
              <textarea
                id="feedback-message"
                required
                minLength={10}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="What broke? What should exist? Rant, rave, or brainstorm with me. ✨"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>
          </div>

          <input type="hidden" value={pageUrl} readOnly />

          <DialogFooter className="sm:justify-center pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-w-[200px]"
            >
              {isSubmitting ? "Sending..." : "🚀 Send Feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
