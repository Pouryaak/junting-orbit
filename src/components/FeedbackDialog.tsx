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
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>💌 Tell Me What You Think</DialogTitle>
          <DialogDescription>
            I'm a one-person crew pulling overtime to make Junting Orbit magical. Send
            your bugs, dreams, and spicy takes—nothing makes me happier than hearing
            from you. 🙌
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="feedback-title" className="text-sm font-medium text-foreground">
              ✏️ Short title
            </label>
            <input
              id="feedback-title"
              type="text"
              required
              minLength={3}
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={feedbackType === "bug" ? "Broken apply button on LinkedIn" : "Add support for Slack alerts"}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-xs text-muted-foreground">
              Give me a headline so I can spot your note quickly when I crawl out of my
              caffeine cave ☕️.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              🔍 What kind of note is this?
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="feedback-type"
                  value="bug"
                  checked={feedbackType === "bug"}
                  onChange={() => setFeedbackType("bug")}
                  className="h-4 w-4 border border-input text-primary focus:ring-primary"
                />
                🐛 Bug (help me squash it)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="feedback-type"
                  value="feature"
                  checked={feedbackType === "feature"}
                  onChange={() => setFeedbackType("feature")}
                  className="h-4 w-4 border border-input text-primary focus:ring-primary"
                />
                🌟 Feature idea (keep them coming)
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="feedback-message" className="text-sm font-medium text-foreground">
              💬 What’s on your mind?
            </label>
            <textarea
              id="feedback-message"
              required
              minLength={10}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="What broke? What should exist? Rant, rave, or brainstorm with me. ✨"
              className="h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-xs text-muted-foreground">
              More detail = faster fixes and cooler upgrades. Screens, steps, dreams—I'll take it all. 🚀
            </p>
          </div>

          <input type="hidden" value={pageUrl} readOnly />

          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Sending love..." : "🚀 Shoot it over"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
