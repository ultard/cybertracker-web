import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
	test('shows CyberTracker heading and tournament CTA', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { name: 'CyberTracker', level: 1 })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Открыть турниры' })).toBeVisible();
	});

	test('header links to disciplines and login', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('navigation').getByRole('link', { name: 'Турниры' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Вход' })).toBeVisible();
	});
});
