import { useEffect, useRef } from 'react';
import { CompanyProfile, ExpressTemplate } from '../types';

const STORAGE_KEY = 'remix-designmd-companies';
const TEMPLATES_STORAGE_KEY = 'remix-global-templates';

/**
 * Load companies from localStorage. Returns null if nothing saved.
 */
export function loadCompanies(): CompanyProfile[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CompanyProfile[];
  } catch {
    return null;
  }
}

/**
 * Save companies to localStorage.
 */
export function saveCompanies(companies: CompanyProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

/**
 * Hook that auto-saves companies to localStorage whenever they change.
 * Uses debouncing (500ms) to avoid excessive writes.
 */
export function usePersistence(companies: CompanyProfile[]): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip the initial mount to avoid overwriting saved data with defaults
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveCompanies(companies);
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [companies]);
}

// ═══ Template Persistence ═══

/**
 * Load custom templates from localStorage. Returns null if nothing saved.
 */
export function loadTemplates(): ExpressTemplate[] | null {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ExpressTemplate[];
  } catch {
    return null;
  }
}

/**
 * Save custom templates to localStorage.
 */
export function saveTemplates(templates: ExpressTemplate[]): void {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.warn('Failed to save templates to localStorage:', e);
  }
}

/**
 * Hook that auto-saves templates to localStorage whenever they change.
 * Uses debouncing (500ms) to avoid excessive writes.
 */
export function useTemplatePersistence(templates: ExpressTemplate[]): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveTemplates(templates);
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [templates]);
}

/**
 * Clear all persisted data.
 */
export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TEMPLATES_STORAGE_KEY);
}
