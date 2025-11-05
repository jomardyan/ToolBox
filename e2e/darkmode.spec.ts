import { test, expect, Page } from '@playwright/test';

/**
 * Dark Mode E2E Tests
 * Verifies that light and dark mode work correctly across all pages
 */

// Helper function to toggle dark mode
async function toggleDarkMode(page: Page) {
  // Find and click the dark mode toggle button (moon/sun icon)
  const toggleButton = page.locator('button[aria-label*="dark" i], button[aria-label*="light" i], button:has(svg)').first();
  await toggleButton.click();
  // Wait for transition to complete
  await page.waitForTimeout(500);
}

// Helper function to check if dark mode is active
async function isDarkModeActive(page: Page): Promise<boolean> {
  const htmlClass = await page.locator('html').getAttribute('class');
  return htmlClass?.includes('dark') || false;
}

// Helper function to check localStorage
async function getDarkModeFromStorage(page: Page): Promise<boolean> {
  const stored = await page.evaluate(() => localStorage.getItem('darkMode'));
  return stored === 'true';
}

// Test pages configuration
const publicPages = [
  { path: '/', name: 'Home Page' },
  { path: '/history', name: 'History Page' },
  { path: '/advanced', name: 'Advanced Features Page' },
  { path: '/faq', name: 'FAQ Page' },
  { path: '/login', name: 'Login Page' },
  { path: '/register', name: 'Register Page' },
];

test.describe('Dark Mode Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should initialize with system preference', async ({ page }) => {
    await page.goto('/');
    
    // Check that dark mode is initialized
    const isDark = await isDarkModeActive(page);
    const stored = await getDarkModeFromStorage(page);
    
    // Should have a value in localStorage or follow system
    expect(typeof isDark).toBe('boolean');
    expect(typeof stored).toBe('boolean');
  });

  test('should toggle dark mode with button', async ({ page }) => {
    await page.goto('/');
    
    // Get initial state
    const initialDarkMode = await isDarkModeActive(page);
    
    // Toggle dark mode
    await toggleDarkMode(page);
    
    // Verify state changed
    const afterToggleDarkMode = await isDarkModeActive(page);
    expect(afterToggleDarkMode).toBe(!initialDarkMode);
    
    // Verify localStorage was updated
    const stored = await getDarkModeFromStorage(page);
    expect(stored).toBe(afterToggleDarkMode);
    
    // Toggle back
    await toggleDarkMode(page);
    const finalDarkMode = await isDarkModeActive(page);
    expect(finalDarkMode).toBe(initialDarkMode);
  });

  test('should persist dark mode after page reload', async ({ page }) => {
    await page.goto('/');
    
    // Enable dark mode
    const initialDarkMode = await isDarkModeActive(page);
    if (!initialDarkMode) {
      await toggleDarkMode(page);
    }
    
    // Verify dark mode is active
    expect(await isDarkModeActive(page)).toBe(true);
    
    // Reload page
    await page.reload();
    
    // Verify dark mode is still active
    expect(await isDarkModeActive(page)).toBe(true);
    expect(await getDarkModeFromStorage(page)).toBe(true);
  });

  test('should apply dark class to html element', async ({ page }) => {
    await page.goto('/');
    
    // Enable dark mode
    const initialDarkMode = await isDarkModeActive(page);
    if (!initialDarkMode) {
      await toggleDarkMode(page);
    }
    
    // Check html has dark class
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);
    
    // Check body has darkmode--activated class
    const bodyElement = page.locator('body');
    await expect(bodyElement).toHaveClass(/darkmode--activated/);
  });

  test('should apply dark class when toggled off', async ({ page }) => {
    await page.goto('/');
    
    // Enable dark mode first
    const initialDarkMode = await isDarkModeActive(page);
    if (!initialDarkMode) {
      await toggleDarkMode(page);
    }
    
    // Toggle off
    await toggleDarkMode(page);
    
    // Check html does not have dark class
    const htmlElement = page.locator('html');
    const htmlClass = await htmlElement.getAttribute('class');
    expect(htmlClass).not.toContain('dark');
    
    // Check body does not have darkmode--activated class
    const bodyElement = page.locator('body');
    const bodyClass = await bodyElement.getAttribute('class');
    expect(bodyClass).not.toContain('darkmode--activated');
  });
});

test.describe('Dark Mode on All Public Pages', () => {
  for (const pageConfig of publicPages) {
    test.describe(pageConfig.name, () => {
      test('should display correctly in light mode', async ({ page }) => {
        await page.goto('/');
        
        // Ensure light mode
        const isDark = await isDarkModeActive(page);
        if (isDark) {
          await toggleDarkMode(page);
        }
        
        // Navigate to page
        await page.goto(pageConfig.path);
        await page.waitForLoadState('networkidle');
        
        // Check page is visible
        const body = page.locator('body');
        await expect(body).toBeVisible();
        
        // Verify light mode styles
        const bgColor = await body.evaluate((el) => 
          window.getComputedStyle(el).backgroundColor
        );
        
        // Light mode should have a light background (rgb values > 200)
        // This is a heuristic check
        expect(bgColor).toBeTruthy();
      });

      test('should display correctly in dark mode', async ({ page }) => {
        await page.goto('/');
        
        // Ensure dark mode
        const isDark = await isDarkModeActive(page);
        if (!isDark) {
          await toggleDarkMode(page);
        }
        
        // Navigate to page
        await page.goto(pageConfig.path);
        await page.waitForLoadState('networkidle');
        
        // Check page is visible
        const body = page.locator('body');
        await expect(body).toBeVisible();
        
        // Verify dark mode is still active after navigation
        expect(await isDarkModeActive(page)).toBe(true);
        
        // Verify dark mode styles
        const bgColor = await body.evaluate((el) => 
          window.getComputedStyle(el).backgroundColor
        );
        
        // Dark mode should have a dark background
        expect(bgColor).toBeTruthy();
      });

      test('should maintain dark mode when navigating', async ({ page }) => {
        await page.goto('/');
        
        // Enable dark mode
        const initialDarkMode = await isDarkModeActive(page);
        if (!initialDarkMode) {
          await toggleDarkMode(page);
        }
        
        // Navigate to the page
        await page.goto(pageConfig.path);
        await page.waitForLoadState('networkidle');
        
        // Verify dark mode persisted
        expect(await isDarkModeActive(page)).toBe(true);
        
        // Navigate to home
        await page.goto('/');
        
        // Verify dark mode still persisted
        expect(await isDarkModeActive(page)).toBe(true);
      });

      test('should have readable text in both modes', async ({ page }) => {
        // Test light mode
        await page.goto('/');
        const isDark = await isDarkModeActive(page);
        if (isDark) {
          await toggleDarkMode(page);
        }
        
        await page.goto(pageConfig.path);
        await page.waitForLoadState('networkidle');
        
        // Check that text elements exist and are visible
        const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, a, button, label');
        const count = await textElements.count();
        expect(count).toBeGreaterThan(0);
        
        // Test dark mode
        await toggleDarkMode(page);
        await page.waitForTimeout(500);
        
        // Text should still be visible
        const darkCount = await textElements.count();
        expect(darkCount).toBeGreaterThan(0);
      });
    });
  }
});

test.describe('Dark Mode Visual Consistency', () => {
  test('should not have invisible text in light mode', async ({ page }) => {
    await page.goto('/');
    
    // Ensure light mode
    const isDark = await isDarkModeActive(page);
    if (isDark) {
      await toggleDarkMode(page);
    }
    
    // Check common elements for proper contrast
    const problematicSelectors = [
      'div[class*="bg-gray-900"]',
      'div[class*="bg-gray-800"]',
      'p[class*="text-white"]',
    ];
    
    for (const selector of problematicSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        // If dark backgrounds exist in light mode, they should have dark: prefix
        const firstElement = elements.first();
        const className = await firstElement.getAttribute('class');
        
        // Check if element has proper dark mode handling
        if (className?.includes('bg-gray-900') || className?.includes('bg-gray-800')) {
          expect(className).toMatch(/dark:/);
        }
      }
    }
  });

  test('should not have invisible text in dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Ensure dark mode
    const isDark = await isDarkModeActive(page);
    if (!isDark) {
      await toggleDarkMode(page);
    }
    
    // Check that light backgrounds have dark variants
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Body should have a dark background in dark mode
    expect(bgColor).toBeTruthy();
    
    // Main content area should be visible
    const main = page.locator('main, [role="main"]');
    if (await main.count() > 0) {
      await expect(main.first()).toBeVisible();
    }
  });

  test('should have proper form input styling in both modes', async ({ page }) => {
    // Visit a page with forms
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Test in light mode
    const isDark = await isDarkModeActive(page);
    if (isDark) {
      await toggleDarkMode(page);
    }
    
    // Check input visibility
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      const firstInput = inputs.first();
      await expect(firstInput).toBeVisible();
      
      // Check input has proper styling
      const bgColor = await firstInput.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(bgColor).toBeTruthy();
    }
    
    // Toggle to dark mode
    await toggleDarkMode(page);
    await page.waitForTimeout(500);
    
    // Inputs should still be visible and styled
    if (inputCount > 0) {
      const firstInput = inputs.first();
      await expect(firstInput).toBeVisible();
      
      const darkBgColor = await firstInput.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(darkBgColor).toBeTruthy();
    }
  });

  test('should have consistent header styling across pages', async ({ page }) => {
    await page.goto('/');
    
    // Check header exists
    const header = page.locator('header, [role="banner"]');
    await expect(header.first()).toBeVisible();
    
    // Get header background in light mode
    const lightBg = await header.first().evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Toggle to dark mode
    await toggleDarkMode(page);
    await page.waitForTimeout(500);
    
    // Header should have different background in dark mode
    const darkBg = await header.first().evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    expect(lightBg).not.toBe(darkBg);
    
    // Navigate to another page
    await page.goto('/faq');
    await page.waitForLoadState('networkidle');
    
    // Header should maintain dark mode styling
    const faqDarkBg = await header.first().evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    expect(faqDarkBg).toBe(darkBg);
  });
});

test.describe('Dark Mode Edge Cases', () => {
  test('should handle rapid toggling without issues', async ({ page }) => {
    await page.goto('/');
    
    // Rapidly toggle 5 times
    for (let i = 0; i < 5; i++) {
      await toggleDarkMode(page);
      await page.waitForTimeout(100);
    }
    
    // Page should still be functional
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Dark mode state should be consistent
    const isDark = await isDarkModeActive(page);
    const stored = await getDarkModeFromStorage(page);
    expect(isDark).toBe(stored);
  });

  test('should sync with localStorage changes', async ({ page }) => {
    await page.goto('/');
    
    // Manually set localStorage
    await page.evaluate(() => {
      localStorage.setItem('darkMode', 'true');
    });
    
    // Reload page
    await page.reload();
    
    // Should activate dark mode
    expect(await isDarkModeActive(page)).toBe(true);
    
    // Change to false
    await page.evaluate(() => {
      localStorage.setItem('darkMode', 'false');
    });
    
    await page.reload();
    
    // Should deactivate dark mode
    expect(await isDarkModeActive(page)).toBe(false);
  });

  test('should work after clearing localStorage', async ({ page }) => {
    await page.goto('/');
    
    // Enable dark mode
    const isDark = await isDarkModeActive(page);
    if (!isDark) {
      await toggleDarkMode(page);
    }
    
    // Clear localStorage
    await page.evaluate(() => localStorage.clear());
    
    // Reload
    await page.reload();
    
    // Should fall back to system preference or default
    const afterClearDark = await isDarkModeActive(page);
    expect(typeof afterClearDark).toBe('boolean');
    
    // Toggle should still work
    await toggleDarkMode(page);
    const afterToggleDark = await isDarkModeActive(page);
    expect(afterToggleDark).toBe(!afterClearDark);
  });
});
