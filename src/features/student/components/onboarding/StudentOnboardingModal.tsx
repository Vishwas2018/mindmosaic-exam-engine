"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { useOnboardingStore } from "@/features/student/onboarding/onboarding-store";
import { OnboardingStepWelcome } from "./OnboardingStepWelcome";
import { OnboardingStepInterests } from "./OnboardingStepInterests";
import { OnboardingStepGoal } from "./OnboardingStepGoal";
import { OnboardingDiagnosticRunner } from "./OnboardingDiagnosticRunner";
import { OnboardingDiagnosticSummary } from "./OnboardingDiagnosticSummary";

export interface StudentOnboardingModalProps {
  firstName: string | null;
  yearLevel: number | null;
  onboardingCompleted: boolean;
  interests?: readonly string[];
  weeklyGoalMinutes?: number;
  /** The signed-in student's id. Scopes "closed the welcome" to this child on this browser. */
  studentId?: string;
}

const DISMISSED_KEY = (studentId: string) => `mm.onboarding.welcome-dismissed.${studentId}`;

/** Whether this child already closed the welcome on this browser. Storage can be unavailable; then it shows. */
function wasDismissed(studentId: string | undefined): boolean {
  if (!studentId) return false;
  try {
    return window.localStorage.getItem(DISMISSED_KEY(studentId)) === "1";
  } catch {
    return false;
  }
}

export function StudentOnboardingModal({
  firstName,
  yearLevel,
  onboardingCompleted,
  interests,
  weeklyGoalMinutes,
  studentId,
}: StudentOnboardingModalProps) {
  const router = useRouter();
  const { isOpen, step, setStep, open, close, reset } = useOnboardingStore();
  const initialisedRef = useRef(false);

  /* Auto-open once for a child who has not onboarded. A child who closes it is not asked again on every return to
     My Space: the warmup banner stays on the page as the way back in. */
  useEffect(() => {
    if (!initialisedRef.current && !onboardingCompleted && !wasDismissed(studentId)) {
      initialisedRef.current = true;
      open({
        initialYearLevel: yearLevel,
        initialInterests: interests,
        initialWeeklyGoal: weeklyGoalMinutes,
      });
    }
  }, [onboardingCompleted, yearLevel, interests, weeklyGoalMinutes, open, studentId]);

  const handleClose = () => {
    if (studentId) {
      try {
        window.localStorage.setItem(DISMISSED_KEY(studentId), "1");
      } catch {
        /* Storage blocked: the welcome may show again next time, which is harmless. */
      }
    }
    close();
  };

  const handleFinish = () => {
    reset();
    router.refresh();
  };

  const getStepTitle = () => {
    switch (step) {
      case "welcome":
        return "Welcome to MindMosaic";
      case "interests":
        return "Focus Areas";
      case "goal":
        return "Weekly Practice Target";
      case "warmup_questions":
        return "Diagnostic Warmup";
      case "warmup_summary":
        return "Warmup Complete";
      default:
        return "Student Onboarding";
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={getStepTitle()}
      className="max-w-xl"
      hideCloseButton={step === "warmup_summary"}
    >
      {step === "welcome" && (
        <OnboardingStepWelcome
          firstName={firstName}
          onNext={() => setStep("interests")}
        />
      )}

      {step === "interests" && (
        <OnboardingStepInterests
          onBack={() => setStep("welcome")}
          onNext={() => setStep("goal")}
        />
      )}

      {step === "goal" && (
        <OnboardingStepGoal
          onBack={() => setStep("interests")}
          onStartWarmup={() => setStep("warmup_questions")}
        />
      )}

      {step === "warmup_questions" && <OnboardingDiagnosticRunner />}

      {step === "warmup_summary" && (
        <OnboardingDiagnosticSummary onFinish={handleFinish} />
      )}
    </Modal>
  );
}
