# E2E Testing with Playwright

This directory contains end-to-end tests for the ToolBox application, with a focus on dark/light mode functionality.

## Test Files

### `darkmode.spec.ts`
Comprehensive tests for dark mode functionality:
- ✅ Initialize with system preference
- ✅ Toggle dark mode with button
- ✅ Persist after page reload
- ✅ Apply correct CSS classes (`dark`, `darkmode--activated`)
- ✅ Test all public pages in both modes
- ✅ Verify text readability
- ✅ Maintain dark mode across navigation
- ✅ Handle edge cases (rapid toggling, localStorage sync)

### `accessibility.spec.ts`
Accessibility tests for dark mode:
- ✅ Keyboard accessibility
- ✅ Proper ARIA labels
- ✅ Focus management
- ✅ Color contrast in both modes
- ✅ Form input accessibility
- ✅ Reduced motion support

### `visual.spec.ts`
Visual regression tests:
- ✅ Screenshot comparison for all pages
- ✅ Header styling consistency
- ✅ Form element visibility
- ✅ Button styling
- ✅ Component-specific tests (FAQ cards, BatchProcessor, alerts, tables)

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug mode
```bash
npm run test:e2e:debug
```

### View HTML report
```bash
npm run test:e2e:report
```

### Run specific test file
```bash
npx playwright test darkmode.spec.ts
```

### Run specific test
```bash
npx playwright test -g "should toggle dark mode with button"
```

## Test Coverage

### Pages Tested
- ✅ Home Page (`/`)
- ✅ History Page (`/history`)
- ✅ Advanced Features Page (`/advanced`)
- ✅ FAQ Page (`/faq`)
- ✅ Login Page (`/login`)
- ✅ Register Page (`/register`)

### Features Tested
1. **Dark Mode Initialization**
   - System preference detection
   - localStorage persistence
   - Default state handling

2. **Toggle Functionality**
   - Button click toggle
   - Keyboard navigation
   - State persistence

3. **CSS Classes**
   - `dark` class on `<html>`
   - `darkmode--activated` class on `<body>`
   - Removal when toggled off

4. **Visual Consistency**
   - Text readability in both modes
   - No invisible text
   - Proper form input styling
   - Consistent header styling

5. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Color contrast
   - Focus management

6. **Edge Cases**
   - Rapid toggling
   - localStorage clearing
   - Manual localStorage changes
   - Cross-page navigation

## Configuration

Tests are configured in `playwright.config.ts`:
- Base URL: `http://localhost:5173`
- Browser: Chromium (Desktop Chrome)
- Auto-starts dev server
- Screenshots on failure
- HTML and list reporters

## CI/CD

Tests are designed to run in CI:
- Retry failed tests twice on CI
- Sequential execution on CI (parallel locally)
- Must pass for deployment

## Visual Testing

Visual tests use screenshot comparison:
- Baseline screenshots stored in `e2e/**/__screenshots__/`
- Update baselines: `npx playwright test --update-snapshots`
- Max diff pixels: 100 (allows minor rendering differences)

## Debugging Failed Tests

1. **View trace**:
   ```bash
   npx playwright show-trace trace.zip
   ```

2. **Run in debug mode**:
   ```bash
   npm run test:e2e:debug
   ```

3. **View screenshots**:
   - Check `test-results/` directory
   - Failed test screenshots saved automatically

4. **Check console logs**:
   - Tests capture browser console
   - Available in test output

## Best Practices

1. **Wait for state**: Always use `waitForLoadState('networkidle')` after navigation
2. **Wait for transitions**: Add `waitForTimeout(500)` after dark mode toggle
3. **Verify visibility**: Use `expect(element).toBeVisible()` before assertions
4. **Clean state**: Clear localStorage before each test
5. **Specific selectors**: Use data-testid attributes for stable selectors

## Adding New Tests

1. Create new `.spec.ts` file in `e2e/` directory
2. Import test utilities: `import { test, expect } from '@playwright/test';`
3. Use descriptive test names
4. Group related tests in `test.describe()` blocks
5. Run locally before committing

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify baseURL is correct

### Flaky tests
- Add explicit waits
- Check for race conditions
- Use `waitForLoadState()`

### Visual diff failures
- Update baselines if intentional change
- Check for dynamic content
- Verify browser rendering consistency

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
