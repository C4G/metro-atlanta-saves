import { expect, test } from '@playwright/test';

test.describe('homepage accessibility structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('provides a descriptive title and a single page heading', async ({ page }) => {
    await expect(page).toHaveTitle('Financial Wellbeing Programs | Financial Wellbeing Alliance');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Financial wellbeing programs for Atlanta communities',
    );
  });

  test('appends the configured title ending on other pages', async ({ page }) => {
    await page.goto('/about-us');
    await expect(page).toHaveTitle('About Us | Financial Wellbeing Alliance');
  });

  test('provides landmarks and a working skip link', async ({ page }) => {
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    const main = page.getByRole('main');

    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(1);
    await expect(main).toHaveAttribute('id', 'main-content');
    await expect(skipLink).toHaveAttribute('href', '#main-content');

    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
    await skipLink.press('Enter');
    await expect(main).toBeFocused();
  });

  test('names the home logo link and describes the hero image', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Building Resilient Professionals home' })).toHaveCount(1);
    await expect(
      page.getByAltText('Financial Wellbeing Alliance participants pose together in front of graduation decorations'),
    ).toHaveCount(1);
  });
});
