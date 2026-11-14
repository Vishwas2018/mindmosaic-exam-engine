import Link from "next/link";
import {
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  ClipboardCheck,
  Dumbbell,
  Flag,
  Flame,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Search,
  Settings,
  SpellCheck2,
  Target,
  TrendingUp,
  BarChart3,
} from "lucide-react";

import { isVihaanScholarshipPrepEnabled } from "@/features/flags/vihaan-scholarship-prep";
import { isSingaporeMathsSampleAllowed } from "@/features/flags/singapore-maths-sample";

import { MindMosaicLogo } from "@/components/branding";
import type { LessonPathway } from "@/features/curriculum/lessons";
import type { WeekDot } from "@/features/student/engagement/streaks";

export type StudentSidebarKey =
  | "home"
  | "learn"
  | "practice"
  | "examCentre"
  | "progress"
  | "singaporeMathsSample"
  | "vihaan";

interface SidebarNavItem {
  key: StudentSidebarKey;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const baseSidebarItems: readonly SidebarNavItem[] = [
  { key: "home", label: "Dashboard", href: "/student", icon: LayoutDashboard },
  { key: "learn", label: "Learning Hub", href: "/student/learn", icon: BookOpen, badge: "Stage 3" },
  { key: "practice", label: "Practice Studio", href: "/student/practice", icon: Target },
  { key: "examCentre", label: "Exam Centre", href: "/student/exam-preparation", icon: ClipboardCheck, badge: "NAPLAN" },
  { key: "progress", label: "My Progress", href: "/student/engagement", icon: TrendingUp },
];

export const SIDEBAR_NAV_ITEMS: readonly SidebarNavItem[] = [
  ...baseSidebarItems,
  ...(isSingaporeMathsSampleAllowed()
    ? [
        {
          key: "singaporeMathsSample" as const,
          label: "Singapore Maths Sample",
          href: "/practice/singapore-maths/sample",
          icon: BarChart3,
        },
      ]
    : []),
  ...(isVihaanScholarshipPrepEnabled() ? [vihaanNavItem] : []),
];

const vihaanNavItem: SidebarNavItem = {
  key: "vihaan" as const,
  label: "Vihaan Scholarship Prep",
  href: "/student/vihaan",
  icon: GraduationCap,
};
