import { expect, test } from '@playwright/test';

test.describe('password recovery', () => {
  test('validates recovery email and gives a usable path for a missing reset link', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: 'Reset your password', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Send reset instructions', exact: true }).click();
    await expect(page.getByText('Email is required.', { exact: true })).toBeVisible();
    await page.goto('/reset-password');
    await expect(page.getByRole('heading', { name: 'Request a new password link', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Request reset instructions', exact: true }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });
  test('validates matching new passwords and supports password visibility', async ({ page }) => {
    await page.goto('/reset-password?token=ui-validation-only');
    await page.getByLabel('New password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirm new password', { exact: true }).fill('Different123!');
    await page.getByRole('button', { name: 'Reset password', exact: true }).click();
    await expect(page.getByText('The passwords do not match.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Show passwords', exact: true }).click();
    await expect(page.getByLabel('New password', { exact: true })).toHaveAttribute('type', 'text');
    await page.getByRole('link', { name: 'Return to sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
