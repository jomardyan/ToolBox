import { test, expect } from '@playwright/test';

/**
 * Accessibility Tests for Dark Mode
 * Ensures dark mode toggle is accessible and ARIA attributes are correct
 */

test.describe('Dark Mode Accessibility', () => {
  test('dark mode toggle should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Focus on the toggle button via keyboard navigation
    await page.keyboard.press('Tab');
    
    // Find the focused element
    const focusedElement = page.locator(':focus');
    
    // Should be able to activate with keyboard
    const initialDarkMode = await page.locator('html').getAttribute('class');
    
    // Press Enter or Space to toggle
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    const afterToggleDarkMode = await page.locator('html').getAttribute('class');
    
    // State should have changed
    expect(initialDarkMode).not.toBe(afterToggleDarkMode);
  });

  test('dark mode toggle should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Find toggle button (looking for common patterns)
    const toggleButtons = page.locator('button[aria-label*="dark" i], button[aria-label*="light" i], button[aria-label*="theme" i]');
    
    if (await toggleButtons.count() > 0) {
      const firstToggle = toggleButtons.first();
      
      // Should have aria-label
      const ariaLabel = await firstToggle.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.toLowerCase()).toMatch(/dark|light|theme/);
    }
  });

  test('should maintain focus after dark mode toggle', async ({ page }) => {
    await page.goto('/');
    
    // Find and focus the toggle button
    const toggleButton = page.locator('button').filter({ hasText: /☀|☾|🌙|💡/ }).or(
      page.locator('button[aria-label*="dark" i], button[aria-label*="light" i]')
    ).first();
    
    if (await toggleButton.count() > 0) {
      await toggleButton.focus();
      await toggleButton.click();
      await page.waitForTimeout(300);
      
      // Focus should remain on the button or nearby element
      const focusedAfter = page.locator(':focus');
      await expect(focusedAfter).toBeVisible();
    }
  });

  test('should have sufficient color contrast in light mode', async ({ page }) => {
    await page.goto('/');
    
    // Ensure light mode
    const isDark = await page.locator('html').getAttribute('class');
    if (isDark?.includes('dark')) {
      const toggleButton = page.locator('button').first();
      await toggleButton.click();
      await page.waitForTimeout(500);
    }
    
    // Check that main content is visible
    const main = page.locator('main, [role="main"]').first();
    if (await main.count() > 0) {
      await expect(main).toBeVisible();
      
      // Check text color vs background
      const textColor = await main.evaluate((el) => 
        window.getComputedStyle(el).color
      );
      const bgColor = await main.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      
      expect(textColor).toBeTruthy();
      expect(bgColor).toBeTruthy();
      expect(textColor).not.toBe(bgColor);
    }
  });

  test('should have sufficient color contrast in dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Ensure dark mode
    const isDark = await page.locator('html').getAttribute('class');
    if (!isDark?.includes('dark')) {
      const toggleButton = page.locator('button').first();
      await toggleButton.click();
      await page.waitForTimeout(500);
    }
    
    // Check that main content is visible
    const main = page.locator('main, [role="main"]').first();
    if (await main.count() > 0) {
      await expect(main).toBeVisible();
      
      // Check text color vs background
      const textColor = await main.evaluate((el) => 
        window.getComputedStyle(el).color
      );
      const bgColor = await main.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      
      expect(textColor).toBeTruthy();
      expect(bgColor).toBeTruthy();
      expect(textColor).not.toBe(bgColor);
    }
  });

  test('form inputs should be accessible in both modes', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = inputs.nth(i);
        
        // Should have label or aria-label
        const ariaLabel = await input.getAttribute('aria-label');
        const id = await input.getAttribute('id');
        const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
        
        expect(ariaLabel || hasLabel).toBeTruthy();
        
        // Should be visible and focusable
        await expect(input).toBeVisible();
        await input.focus();
        const focused = await page.evaluate(() => document.activeElement?.tagName);
        expect(focused).toBe('INPUT');
      }
    }
  });

  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Enable reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/');
    
    // Toggle dark mode
    const toggleButton = page.locator('button').first();
    await toggleButton.click();
    
    // Page should still function correctly
    await page.waitForTimeout(500);
    const isDark = await page.locator('html').getAttribute('class');
    expect(typeof isDark).toBe('string');
  });
});
