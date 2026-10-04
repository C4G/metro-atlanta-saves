import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

test.describe('authentication', () => {
  test('allows a new user to sign up, sign out, and log in', async ({ page }) => {
    const email = `e2e-${randomUUID()}@example.com`;
    const firstName = 'E2E';
    const lastName = 'Tester';
    const initials = `${firstName[0]}${lastName[0]}`;
    const password = 'ValidPassword123!';

    await page.goto('/register');
    await expect(page.getByLabel('First Name')).toBeVisible();
    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    const accountMenu = page.getByRole('button', { name: 'Open account menu' });
    await expect(accountMenu).toBeVisible();
    await expect(accountMenu).toContainText(initials);

    await accountMenu.click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    const signInLink = page.getByRole('link', { name: 'Sign in' });
    await expect(signInLink).toBeVisible();

    await signInLink.click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('button', { name: 'Open account menu' })).toContainText(initials);

    await page.getByRole('button', { name: 'Open account menu' }).click();
    await page.getByRole('menuitem', { name: 'Edit Profile' }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole('heading', { name: 'Profile and preferences' })).toBeVisible();
    await page.getByLabel('About you').fill('Updated from the profile page');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Your profile has been updated!')).toBeVisible();
  });
});
