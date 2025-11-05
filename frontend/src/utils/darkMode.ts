/**
 * Darkmode.ts - Systematic Dark Mode Management
 * Inspired by Darkmode.js (MIT License - Sandoche Adittane)
 * Adapted for React + Tailwind CSS with class-based approach
 */

export const IS_BROWSER = typeof window !== 'undefined';

const STORAGE_KEY = 'darkMode';
const DARK_CLASS = 'dark';
const ACTIVATED_CLASS = 'darkmode--activated';

export interface DarkmodeOptions {
  autoMatchOsTheme?: boolean;
  saveInCookies?: boolean;
}

export class Darkmode {
  private options: Required<DarkmodeOptions> = {
    autoMatchOsTheme: true,
    saveInCookies: true,
  };

  constructor(options: DarkmodeOptions = {}) {
    if (!IS_BROWSER) {
      return;
    }

    this.options = { ...this.options, ...options };

    // Initialize dark mode based on stored preference or OS theme
    this.initialize();
  }

  private initialize(): void {
    const darkmodeActivated = window.localStorage.getItem(STORAGE_KEY) === 'true';
    const preferredThemeOs =
      this.options.autoMatchOsTheme && 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const darkmodeNeverActivatedByAction = window.localStorage.getItem(STORAGE_KEY) === null;

    // Activate dark mode if:
    // 1. User previously enabled it, OR
    // 2. No user preference exists AND OS prefers dark mode
    if (
      (darkmodeActivated === true && this.options.saveInCookies) ||
      (darkmodeNeverActivatedByAction && preferredThemeOs)
    ) {
      this.activate();
    }

    // Watch for OS theme changes
    if (this.options.autoMatchOsTheme) {
      this.watchSystemTheme();
    }
  }

  private activate(): void {
    document.documentElement.classList.add(DARK_CLASS);
    document.body.classList.add(ACTIVATED_CLASS);
    document.documentElement.style.colorScheme = 'dark';
  }

  private deactivate(): void {
    document.documentElement.classList.remove(DARK_CLASS);
    document.body.classList.remove(ACTIVATED_CLASS);
    document.documentElement.style.colorScheme = 'light';
  }

  private watchSystemTheme(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      // Only auto-update if user hasn't manually set a preference
      const hasManualPreference = window.localStorage.getItem(STORAGE_KEY) !== null;
      if (!hasManualPreference && this.options.autoMatchOsTheme) {
        if (e.matches) {
          this.activate();
        } else {
          this.deactivate();
        }
      }
    });
  }

  /**
   * Toggle dark mode on/off
   */
  toggle(): void {
    if (!IS_BROWSER) {
      return;
    }

    const isDarkmode = this.isActivated();

    if (isDarkmode) {
      this.deactivate();
    } else {
      this.activate();
    }

    // Save preference
    if (this.options.saveInCookies) {
      window.localStorage.setItem(STORAGE_KEY, String(!isDarkmode));
    }
  }

  /**
   * Check if dark mode is currently active
   */
  isActivated(): boolean {
    if (!IS_BROWSER) {
      return false;
    }
    return document.documentElement.classList.contains(DARK_CLASS);
  }
}

// Export singleton instance for easy use
let darkmodeInstance: Darkmode | null = null;

export function getDarkmodeInstance(): Darkmode {
  if (!darkmodeInstance && IS_BROWSER) {
    darkmodeInstance = new Darkmode();
  }
  return darkmodeInstance!;
}

// Legacy API for backward compatibility
export function initializeDarkMode(): boolean {
  const instance = getDarkmodeInstance();
  return instance ? instance.isActivated() : false;
}

export function toggleDarkMode(currentMode: boolean): boolean {
  const instance = getDarkmodeInstance();
  if (instance) {
    instance.toggle();
    return instance.isActivated();
  }
  return currentMode;
}

export function applyDarkMode(isDark: boolean): void {
  const instance = getDarkmodeInstance();
  if (!instance) return;
  
  const isCurrentlyDark = instance.isActivated();
  if (isDark !== isCurrentlyDark) {
    instance.toggle();
  }
}

// Auto-initialize when module loads
if (IS_BROWSER) {
  getDarkmodeInstance();
}
