import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCompactNumber(value: number): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "€ 0"; // Ou pode retornar "N/A" se preferir
  }

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

export const translatePosition = (position: string): string => {
  if (!position) return "N/A";

  const normalizedPosition = position.toUpperCase().trim();

  const positionMap: { [key: string]: string } = {
    // Goleiro
    'GK': 'GOL',
    // Defensores
    'LB': 'LE', 'LWB': 'LE',
    'CB': 'ZAG',
    'RB': 'LD', 'RWB': 'LD',
    // Meio-campistas
    'CDM': 'VOL',
    'LM': 'ME',
    'RM': 'MD',
    'CM': 'MC',
    'CAM': 'MAT',
    // Atacantes
    'LW': 'PE',
    'RW': 'PD',
    'CF': 'SA', 'SS': 'SA',
    'ST': 'ATA',
  };

  return positionMap[normalizedPosition] || normalizedPosition;
};

export const translatePreferredFoot = (foot: string): string => {
  if (!foot) return "N/A";

  const normalizedFoot = foot.toLowerCase().trim();

  const footMap: { [key: string]: string } = {
    'right': 'Direito',
    'left': 'Esquerdo',
  };

  return footMap[normalizedFoot] || foot;
};

export const getPositionDetails = (position: string): { group: 'GOL' | 'DEF' | 'MEIO' | 'ATA'; color: string } => {
  const normalizedPosition = position.toUpperCase().trim();
  const positionMap: { [key: string]: 'GOL' | 'DEF' | 'MEIO' | 'ATA' } = {
    'GOL': 'GOL', 'GK': 'GOL',
    'LE': 'DEF', 'LB': 'DEF', 'ZAG': 'DEF', 'CB': 'DEF', 'LD': 'DEF',
    'RB': 'DEF', 'LWB': 'DEF', 'RWB': 'DEF',
    'VOL': 'MEIO', 'CDM': 'MEIO', 'ME': 'MEIO', 'LM': 'MEIO', 'MD': 'MEIO',
    'RM': 'MEIO', 'MC': 'MEIO', 'CM': 'MEIO', 'MAT': 'MEIO', 'CAM': 'MEIO',
    'PE': 'ATA', 'LW': 'ATA', 'PD': 'ATA', 'RW': 'ATA', 'SA': 'ATA',
    'CF': 'ATA', 'ATA': 'ATA', 'ST': 'ATA',
  };
  const group = positionMap[normalizedPosition] || 'ATA';

  switch (group) {
    case 'GOL': return { group, color: "bg-yellow-500 hover:bg-yellow-600 text-black" };
    case 'DEF': return { group, color: "bg-blue-500 hover:bg-blue-600" };
    case 'MEIO': return { group, color: "bg-green-500 hover:bg-green-600" };
    default: return { group, color: "bg-red-500 hover:bg-red-600" };
  }
};