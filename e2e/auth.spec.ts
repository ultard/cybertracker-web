import { expect, test } from '@playwright/test';

test.describe('Auth pages', () => {
	test('login page has form fields and register link', async ({ page }) => {
		await page.goto('/login');
		await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
		await expect(page.getByLabel('Логин')).toBeVisible();
		await expect(page.getByLabel('Пароль')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Регистрация' })).toHaveAttribute(
			'href',
			'/register'
		);
	});

	test('register page has required fields', async ({ page }) => {
		await page.goto('/register');
		await expect(page.getByRole('heading', { name: /регистрация/i })).toBeVisible();
		await expect(page.getByLabel(/логин/i)).toBeVisible();
		await expect(page.getByLabel(/пароль/i).first()).toBeVisible();
	});

	test('navigate from home to login', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: 'Вход' }).click();
		await expect(page).toHaveURL(/\/login$/);
	});
});
