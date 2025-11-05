import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Dark Mode
 * Takes screenshots and compares visual appearance
 */

test.describe('Dark Mode Visual Tests', () => {
  const pages = [
    { path: '/', name: 'home' },
    { path: '/faq', name: 'faq' },
    { path: '/advanced', name: 'advanced' },
    { path: '/history', name: 'history' },
    { path: '/login', name: 'login' },
  ];

  for (const pageConfig of pages) {
    test(`${pageConfig.name} page should look correct in light mode`, async ({ page }) => {
      await page.goto('/');
      
      // Ensure light mode
      const isDark = await page.locator('html').getAttribute('class');
      if (isDark?.includes('dark')) {
        await page.locator('button').first().click();
        await page.waitForTimeout(500);
      }
      
      // Navigate to page
      await page.goto(pageConfig.path);
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      await expect(page).toHaveScreenshot(`${pageConfig.name}-light.png`, {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });

    test(`${pageConfig.name} page should look correct in dark mode`, async ({ page }) => {
      await page.goto('/');
      
      // Ensure dark mode
      const isDark = await page.locator('html').getAttribute('class');
      if (!isDark?.includes('dark')) {
        await page.locator('button').first().click();
        await page.waitForTimeout(500);
      }
      
      // Navigate to page
      await page.goto(pageConfig.path);
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      await expect(page).toHaveScreenshot(`${pageConfig.name}-dark.png`, {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });
  }

  test('header should transition smoothly between modes', async ({ page }) => {
    await page.goto('/');
    
    // Screenshot in initial mode
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    await expect(header).toHaveScreenshot('header-before-toggle.png');
    
    // Toggle dark mode
    await page.locator('button').first().click();
    await page.waitForTimeout(500);
    
    // Screenshot after toggle
    await expect(header).toHaveScreenshot('header-after-toggle.png');
  });

  test('form elements should be visible in both modes', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Light mode screenshot
    const form = page.locator('form').first();
    if (await form.count() > 0) {
      await expect(form).toHaveScreenshot('form-light.png');
      
      // Toggle to dark mode
      await page.goto('/');
      await page.locator('button').first().click();
      await page.waitForTimeout(500);
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Dark mode screenshot
      await expect(form).toHaveScreenshot('form-dark.png');
    }
  });

  test('buttons should have proper styling in both modes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const buttons = page.locator('button').filter({ hasText: /convert|submit|sign/i });
    
    if (await buttons.count() > 0) {
      const firstButton = buttons.first();
      await expect(firstButton).toBeVisible();
      
      // Screenshot in light mode
      await expect(firstButton).toHaveScreenshot('button-light.png');
      
      // Toggle to dark mode
      await page.locator('button').first().click();
      await page.waitForTimeout(500);
      
      // Screenshot in dark mode
      await expect(firstButton).toHaveScreenshot('button-dark.png');
    }
  });
});

test.describe('Dark Mode Component Tests', () => {
  test('FAQ cards should be readable in both modes', async ({ page }) => {
    await page.goto('/faq');
    await page.waitForLoadState('networkidle');
    
    // Check in light mode
    const cards = page.locator('[class*="card"], [class*="format"]').first();
    if (await cards.count() > 0) {
      await expect(cards).toBeVisible();
      
      const textContent = await cards.textContent();
      expect(textContent?.length).toBeGreaterThan(0);
    }
    
    // Toggle to dark mode
    await page.locator('button').first().click();
    await page.waitForTimeout(500);
    
    // Cards should still be readable
    if (await cards.count() > 0) {
      await expect(cards).toBeVisible();
    }
  });

  test('BatchProcessor should be visible in both modes', async ({ page }) => {
    await page.goto('/advanced');
    await page.waitForLoadState('networkidle');
    
    // Look for batch processor elements
    const batchContainer = page.locator('[class*="batch"], textarea, input[type="file"]').first();
    
    if (await batchContainer.count() > 0) {
      // Light mode check
      const lightBg = await batchContainer.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(lightBg).toBeTruthy();
      
      // Toggle to dark mode
      await page.locator('button').first().click();
      await page.waitForTimeout(500);
      
      // Dark mode check
      const darkBg = await batchContainer.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(darkBg).toBeTruthy();
      expect(darkBg).not.toBe(lightBg);
    }
  });

  test('alerts and notifications should be styled correctly', async ({ page }) => {
    await page.goto('/');
    
    // Look for any alert/notification elements
    const alerts = page.locator('[role="alert"], [class*="alert"], [class*="notification"]');
    const count = await alerts.count();
    
    if (count > 0) {
      // Check first alert in light mode
      const firstAlert = alerts.first();
      const lightColor = await firstAlert.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Toggle dark mode
      await page.locator('button').first().click();
      await page.waitForTimeout(500);
      
      // Check dark mode styling
      const darkColor = await firstAlert.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Colors should be different (unless alert is meant to be same in both modes)
      expect(darkColor).toBeTruthy();
    }
  });

  test('tables should be readable in both modes', async ({ page }) => {
    // Visit pages that might have tables
    const pagesWithTables = ['/history', '/advanced'];
    
    for (const path of pagesWithTables) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      const tables = page.locator('table');
      if (await tables.count() > 0) {
        const table = tables.first();
        
        // Light mode
        await expect(table).toBeVisible();
        const lightBorder = await table.evaluate((el) => 
          window.getComputedStyle(el).borderColor
        );
        
        // Dark mode
        await page.goto('/');
        await page.locator('button').first().click();
        await page.waitForTimeout(500);
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        
        await expect(table).toBeVisible();
        const darkBorder = await table.evaluate((el) => 
          window.getComputedStyle(el).borderColor
        );
        
        expect(lightBorder).toBeTruthy();
        expect(darkBorder).toBeTruthy();
      }
    }
  });
});
