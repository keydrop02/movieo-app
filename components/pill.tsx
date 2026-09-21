import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cx } from "@/lib/utils"

export type PillVariant = "primary" | "secondary"
export type PillSize = "lg" | "md" | "sm"

const BASE =
  "relative rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 font-semibold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed select-none"

const VARIANT: Record<PillVariant, string> = {
  primary: "theme-btn-primary hover:scale-105 shadow-xl shadow-black/10",
  secondary:
    "theme-btn-secondary backdrop-blur-[20px] backdrop-saturate-150 border border-white/10 hover:border-white/20 shadow-lg shadow-black/5",
}

const SIZE: Record<PillSize, string> = {
  lg: "h-[52px] text-lg font-bold px-6 min-w-[130px]",
  md: "h-[44px] text-[15px] px-6 min-w-[120px]",
  sm: "h-9 px-4 text-sm",
}

export function pillClass(variant: PillVariant = "primary", size: PillSize = "lg", extra = ""): string {
  return cx(BASE, VARIANT[variant], SIZE[size], extra)
}

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PillVariant
  size?: PillSize
}

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ variant = "primary", size = "lg", className, children, ...props }, ref) => (
    <button ref={ref} className={pillClass(variant, size, className)} {...props}>
      {children}
    </button>
  ),
)
PillButton.displayName = "PillButton"