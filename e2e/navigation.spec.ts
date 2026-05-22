import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
	test('home card opens tournaments list', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: 'Открыть турниры' }).click();
		await expect(page).toHaveURL(/\/tournaments$/);
	});

	test('header navigates to disciplines', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('navigation').getByRole('link', { name: 'Дисциплины' }).click();
		await expect(page).toHaveURL(/\/disciplines$/);
	});

	test('login page links back to register', async ({ page }) => {
		await page.goto('/login');
		await page.getByRole('link', { name: 'Регистрация' }).click();
		await expect(page).toHaveURL(/\/register$/);
	});
});
