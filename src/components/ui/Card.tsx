import type { HTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type CardVariant = "default" | "soft" | "outlined" | "accent";

const variantClasses: Record<CardVariant, string> = {
  default:
    "border border-royal/10 bg-white shadow-[0_18px_50px_rgba(49,32,86,0.09)]",
  soft: "border border-white/70 bg-white/65 shadow-[0_18px_50px_rgba(49,32,86,0.06)] backdrop-blur-sm",
  outlined: "border border-royal/15 bg-white shadow-none",
  accent:
    "border border-royal/10 bg-[linear-gradient(145deg,#FFFFFF_0%,#F7F4FF_100%)] shadow-[0_18px_50px_rgba(49,32,86,0.09)]",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export function Card({
  className,
  variant = "default",
  ...props
}: CardProps) {
  return (
    <div
      className={twMerge(
        clsx("rounded-3xl", variantClasses[variant], className),
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={twMerge("p-6 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={twMerge(
        "text-xl font-extrabold tracking-[-0.025em] text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={twMerge("mt-1 text-sm leading-6 text-muted", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={twMerge("p-6 pt-3", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge("flex items-center gap-3 p-6 pt-3", className)}
      {...props}
    />
  );
}
