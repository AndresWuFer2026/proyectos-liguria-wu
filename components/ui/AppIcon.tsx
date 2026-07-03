import type { ReactNode } from "react";

export type IconName =
  | "activity"
  | "bar-chart"
  | "briefcase"
  | "calendar"
  | "check-circle"
  | "clipboard"
  | "cog"
  | "factory"
  | "file-text"
  | "gauge"
  | "hard-hat"
  | "layout"
  | "log-out"
  | "shield"
  | "users"
  | "wrench";

type AppIconProps = {
  name: IconName;
  className?: string;
};

const paths: Record<IconName, ReactNode> = {
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  "bar-chart": (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5" />
      <path d="M12 16V8" />
      <path d="M16 16v-9" />
    </>
  ),
  briefcase: (
    <>
      <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
      <path d="M4 7h16v12H4z" />
      <path d="M4 12h16" />
    </>
  ),
  calendar: (
    <>
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <path d="M4 8h16" />
      <path d="M5 5h14v15H5z" />
    </>
  ),
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </>
  ),
  clipboard: (
    <>
      <path d="M9 4h6l1 2h3v15H5V6h3z" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
    </>
  ),
  cog: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="m4.9 4.9 2.1 2.1" />
      <path d="m17 17 2.1 2.1" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="m4.9 19.1 2.1-2.1" />
      <path d="m17 7 2.1-2.1" />
    </>
  ),
  factory: (
    <>
      <path d="M3 21V9l6 4V9l6 4V5h6v16z" />
      <path d="M7 17h2" />
      <path d="M12 17h2" />
      <path d="M17 17h2" />
    </>
  ),
  "file-text": (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 14a8 8 0 0 1 16 0" />
      <path d="M12 14l4-4" />
      <path d="M6 20h12" />
    </>
  ),
  "hard-hat": (
    <>
      <path d="M4 14a8 8 0 0 1 16 0" />
      <path d="M2 14h20" />
      <path d="M8 14V8" />
      <path d="M16 14V8" />
      <path d="M6 18h12" />
    </>
  ),
  layout: (
    <>
      <path d="M4 5h16v14H4z" />
      <path d="M4 10h16" />
      <path d="M9 10v9" />
    </>
  ),
  "log-out": (
    <>
      <path d="M10 5H5v14h5" />
      <path d="M14 16l4-4-4-4" />
      <path d="M8 12h10" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z" />
      <path d="m9 12 2 2 4-5" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.8" />
      <path d="M16 3.2a4 4 0 0 1 0 7.6" />
    </>
  ),
  wrench: (
    <>
      <path d="M14.7 6.3a4 4 0 0 0 5 5L11 20l-4-4z" />
      <path d="M6 18 4 20" />
    </>
  ),
};

export function AppIcon({ name, className = "h-5 w-5" }: AppIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}
