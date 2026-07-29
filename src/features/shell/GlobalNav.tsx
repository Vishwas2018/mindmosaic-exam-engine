import { twMerge } from "tailwind-merge";

import { ROLE_LABELS, type AppRole, type ShellNavItem } from "./types";

export interface GlobalNavProps {
  role: AppRole;
  items: ShellNavItem[];
  activeKey?: string;
  className?: string;
  linkClassName?: string;
}

export function GlobalNav({ role, items, activeKey, className, linkClassName }: GlobalNavProps) {
  return (
    <nav aria-label={`${ROLE_LABELS[role]} navigation`} className={className}>
      <ul role="list" className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <li key={item.key}>
              <a
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={twMerge(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-muted transition hover:bg-royal/7 hover:text-royal",
                  isActive && "bg-royal/8 text-royal",
                  linkClassName,
                )}
              >
                {item.icon}
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
