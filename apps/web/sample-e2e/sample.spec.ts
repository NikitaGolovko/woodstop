import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://maps.geoapify.com/**', route => route.fulfill({ json: {
    version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#eaf0e3' } }]
  } }));
  // A static release must not depend on a backend, even when one happens to run locally.
  await page.route('**/api/**', () => { throw new Error('Static sample attempted a backend request'); });
});

test('bundled discovery starts with seven stands and widens to nine', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Maple Corner — demo' })).toBeVisible();
  await expect(page.locator('.nearby-list > li')).toHaveCount(7);
  await page.getByRole('combobox', { name: 'Within' }).selectOption('25');
  await expect(page.locator('.nearby-list > li')).toHaveCount(9);
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Stand map' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('stand deep links survive refresh and missing listings stay missing', async ({ page }) => {
  await page.goto('/stands/22222222-2222-4222-8222-000000000001');
  await expect(page.getByRole('heading', { name: 'Maple Corner — demo' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('$6.00 per bundle')).toBeVisible();
  await page.goto('/stands/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  await expect(page.getByRole('heading', { name: 'Stand not found' })).toBeVisible();
});
