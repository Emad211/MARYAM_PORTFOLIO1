// Type utilities for handling strict TypeScript types
import { Locale } from 'date-fns';
import { faIR, enUS, de } from 'date-fns/locale';

// Locale utilities
const locales: Record<string, Locale> = {
  fa: faIR,
  en: enUS,
  de: de,
};

export const getValidLocale = (language: string): Locale => {
  const locale = locales[language];
  return locale ?? faIR; // Default to Persian if not found
};

// Type-safe array access
export const safeArrayAccess = <T>(array: T[], index: number): T | undefined => {
  return index >= 0 && index < array.length ? array[index] : undefined;
};

// Type-safe object property access
export const safePropertyAccess = <T, K extends keyof T>(
  obj: T | null | undefined, 
  key: K
): T[K] | undefined => {
  return obj && typeof obj === 'object' && key in obj ? obj[key] : undefined;
};

// Optional property with default
export const withDefault = <T>(value: T | undefined, defaultValue: T): T => {
  return value !== undefined ? value : defaultValue;
};

// Type guard for checking if value is defined
export const isDefined = <T>(value: T | undefined): value is T => {
  return value !== undefined;
};

// Helper for handling optional numeric values
export const ensureNumber = (value: number | undefined, defaultValue: number = 0): number => {
  return typeof value === 'number' ? value : defaultValue;
};

// Helper for handling optional string values
export const ensureString = (value: string | undefined, defaultValue: string = ''): string => {
  return typeof value === 'string' ? value : defaultValue;
};

// Type-safe array filter
export const filterDefined = <T>(array: (T | undefined)[]): T[] => {
  return array.filter(isDefined);
};

// Safe array mutation helper
export const safeArrayUpdate = <T>(
  array: T[],
  index: number,
  updater: (item: T) => T
): T[] => {
  const item = safeArrayAccess(array, index);
  if (!item) return array;
  
  const newArray = [...array];
  newArray[index] = updater(item);
  return newArray;
};