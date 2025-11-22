import React, { useState } from "react";
import { User, Info, MessageCircle, Phone, Plus } from "lucide-react";

type RadialMenuItem = {
  id: string;
  href?: string;
  label?: string;
};

const POSITIONS = [
  { x: 150, y: 0 },
  { x: 150, y: 90 },
  { x: 90, y: 150 },
  { x: 0, y: 150 },
];

const ICONS = [User, Info, MessageCircle, Phone];

const DEFAULT_ITEMS: RadialMenuItem[] = [
  { id: "account", href: "#account", label: "Account" },
  { id: "info", href: "#info", label: "Info" },
  { id: "home", href: "#home", label: "Messages" },
  { id: "contact", href: "#contact", label: "Contact" },
];

interface RadialMenuProps {
  items?: RadialMenuItem[];
}

/**
 * Radial floating menu – React + Tailwind version of your original snippet.
 * - Uses lucide-react icons
 * - Same translation pattern as your JS
 */
export const RadialMenu: React.FC<RadialMenuProps> = ({ items = DEFAULT_ITEMS }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative h-[220px] w-[220px]">
      {/* Menu items */}
      {items.map((item, index) => {
        const Icon = ICONS[index] ?? User;
        const pos = POSITIONS[index] ?? { x: 0, y: 0 };

        const transform = isOpen
          ? `translate(${pos.x}px, ${pos.y}px)`
          : "translate(0, 0)";

        return (
          <a
            key={item.id}
            href={item.href}
            aria-label={item.label}
            className="
              absolute grid h-[70px] w-[70px] place-items-center
              rounded-full bg-white text-indigo-500
              shadow-md transition-transform duration-500
            "
            style={{ transform }}
          >
            <Icon className="h-6 w-6" />
          </a>
        );
      })}

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle radial menu"
        aria-expanded={isOpen}
        className={`
          absolute grid h-24 w-24 place-items-center
          rounded-full bg-slate-900 text-white shadow-lg
          transition-transform duration-300
          top-2 left-2
          ${isOpen ? "rotate-45" : ""}
        `}
      >
        <Plus className="h-8 w-8" />
      </button>
    </div>
  );
};