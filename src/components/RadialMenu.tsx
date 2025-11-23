import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type RadialMenuItem = {
  id: string;
  value: string;
  label: string;
  icon: LucideIcon;
};

interface RadialMenuProps {
  items: RadialMenuItem[];
  activeValue: string;
  onValueChange: (value: string) => void;
}

// Positions fanning out vertically to accommodate text labels
const POSITIONS = [
  { x: 10, y: 60 },    // First item
  { x: 10, y: 120 },   // Second item
  { x: 10, y: 180 },   // Third item
  { x: 10, y: 240 },   // Fourth item
  { x: 10, y: 300 },   // Fifth item
];

export const RadialMenu: React.FC<RadialMenuProps & { className?: string }> = ({ items, activeValue, onValueChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Handle open/close animations
  React.useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      // Double RAF to ensure browser paints the initial state (0,0) before transitioning
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // Delay unmount to allow fan-in animation to complete
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const toggleOpen = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({ x: rect.left, y: rect.top });
    }
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (value: string) => {
    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative z-50 w-14 h-14", className)}>
      {/* Toggle button (Original) */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
        className={cn(
          "relative grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:bg-primary/90 z-10",
          isOpen && "opacity-0 scale-90" // Hide original when open
        )}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Portaled Content */}
      {isMounted && createPortal(
        <>
          {/* Glass Backdrop - Full Screen */}
          <div 
            className={cn(
              "fixed inset-0 bg-background/60 backdrop-blur-md z-[100] transition-opacity duration-300",
              // If we want instant backdrop removal but fan-in items:
              // isOpen ? "opacity-100" : "opacity-0"
              // But usually it looks better if backdrop fades out with items. 
              // User said "keep backdrop instant" previously, but "fan in" implies watching the animation.
              // If backdrop vanishes instantly, items might be hard to read.
              // Let's try fading it out with the items for consistency, or instant if strictly requested.
              // Given "fan in just like how it fans out", and fan out has instant backdrop (currently), 
              // let's make backdrop instant on close too?
              // Current implementation of fan-out has backdrop appearing instantly (no transition class on mount?).
              // Actually, in previous step I removed transition class.
              // Let's keep it simple: Backdrop follows isOpen (instant). Items follow isAnimating (delayed).
              isOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menu Container at captured position */}
          <div 
            className="fixed z-[101] w-14 h-14 pointer-events-none" 
            style={{ left: position.x, top: position.y }}
          >
            {/* Menu items */}
            {items.map((item, index) => {
              const pos = POSITIONS[index] || { x: 0, y: 0 };
              // Start at 0,0, move to pos when animating
              const transform = isAnimating 
                ? `translate(${pos.x}px, ${pos.y}px)` 
                : `translate(0px, 0px)`;

              const isActive = activeValue === item.value;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.value)}
                  aria-label={item.label}
                  className={cn(
                    "absolute top-0 left-0 flex items-center gap-3 pl-3 pr-4 h-12 min-w-[140px] rounded-full shadow-md transition-all duration-300 ease-out origin-top-left pointer-events-auto",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-background text-foreground hover:bg-muted",
                    // Fade in/out and scale up/down
                    isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-50"
                  )}
                  style={{ 
                    transform,
                    transitionDelay: isAnimating ? `${index * 50}ms` : '0ms', // Stagger out, instant/fast in?
                    zIndex: -1 - index
                  }}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}

            {/* Close Button (Clone) */}
            <button
              type="button"
              onClick={toggleOpen}
              aria-label="Close menu"
              className={cn(
                "relative grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 z-10 pointer-events-auto transition-all duration-300",
                 // Rotate and fade out on close
                 isAnimating ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
              )}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};