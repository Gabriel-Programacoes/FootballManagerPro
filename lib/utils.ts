import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    const formatted = Number((value / 1_000_000_000).toFixed(2))
    return `${formatted} bi`
  }
  if (Math.abs(value) >= 1_000_000) {
    const formatted = Number((value / 1_000_000).toFixed(2))
    return `${formatted} mi`
  }
  if (Math.abs(value) >= 1_000) {
    const formatted = Number((value / 1_000).toFixed(2))
    return `${formatted} k`
  }
  return value.toString()
}