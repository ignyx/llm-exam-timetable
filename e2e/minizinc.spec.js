import { test, expect } from '@playwright/test';

test('should execute MiniZinc model and display results', async ({ page }) => {
  await page.goto('/');

  // Wait for the page to load - use testid instead of #status
  await page.waitForSelector('[data-testid="status"]');

  // Click the button to execute the model
  const executeButton = page.getByTestId('execute-button');
  await executeButton.click();

  // Wait for the results to be displayed (with timeout)
  await expect(page.getByText('MiniZinc Results')).toBeVisible();
});
