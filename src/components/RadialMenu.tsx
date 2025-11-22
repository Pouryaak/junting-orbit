import React, { useState } from "react";
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
];

export const RadialMenu: React.FC<RadialMenuProps & { className?: string }> = ({ items, activeValue, onValueChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const handleSelect = (value: string) => {
    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative z-50 w-14 h-14", className)}>
      {/* Menu items */}
      {items.map((item, index) => {
        // Use predefined positions or default to 0,0
        const pos = POSITIONS[index] || { x: 0, y: 0 };
        
        const transform = isOpen
          ? `translate(${pos.x}px, ${pos.y}px)`
          : "translate(0, 0)";

        const isActive = activeValue === item.value;

        return (
          <button
            key={item.id}
            onClick={() => handleSelect(item.value)}
            aria-label={item.label}
            className={cn(
              "absolute top-0 left-0 flex items-center gap-3 pl-3 pr-4 h-12 min-w-[140px] rounded-full shadow-md transition-all duration-300 ease-out origin-top-left",
              isActive 
                ? "bg-primary text-primary-foreground" 
                : "bg-background text-foreground hover:bg-muted",
              isOpen ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-90"
            )}
            style={{ 
              transform,
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              zIndex: -1 - index // Stack behind the toggle button
            }}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}

      {/* Toggle button */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
        className={cn(
          "relative grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-300 hover:bg-primary/90 z-10",
          // No rotation for hamburger/X switch, just icon swap
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
    </div>
  );
};