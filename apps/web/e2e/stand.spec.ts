import { test, expect } from '@playwright/test';
const path = '/stands/11111111-1111-4111-8111-111111111111';

test('reads the seeded stand through the real API and opens accurate directions', async ({ page }) => {
  await page.goto(path);
  await expect(page.getByRole('heading', { name: 'Pine Bend Firewood — demo' })).toBeVisible();
  await expect(page.getByText('$6.00 per bundle')).toBeVisible();
  await expect(page.getByText('Development preview · Fictional stand. Do not travel to this location.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Preview directions link' })).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=43.98%2C-71.12');
  await expect(page.getByText('Current stock unknown')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: `test-results/stand-${test.info().project.name}.png`, fullPage: true });
});

test('unknown facts display without invented values', async ({ page }) => {
  await page.route('**/api/stands/*', async route => {
    const response = await route.fetch();
    await route.fulfill({ json: { ...await response.json(), price: null, priceUnit: null, priceObservedAt: null, paymentMethods: null, paymentObservedAt: null } });
  });
  await page.goto(path);
  await expect(page.getByText('Price unknown', { exact: true })).toBeVisible();
  await expect(page.getByText('Payment methods unknown')).toBeVisible();
});

test('unavailable listing has useful feedback', async ({ page }) => {
  await page.goto('/stands/22222222-2222-4222-8222-222222222222');
  await expect(page.getByRole('heading', { name: 'Stand not found' })).toBeVisible();
});

test('loading and failed requests offer a working retry', async ({ page }) => {
  let fail = true;
  await page.route('**/api/stands/*', async route => {
    await new Promise(resolve => setTimeout(resolve, 250));
    if (fail) await route.fulfill({ status: 503, body: '' });
    else await route.continue();
  });
  await page.goto(path);
  await expect(page.getByRole('status')).toHaveText('Loading stand details…');
  await expect(page.getByRole('alert')).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Pine Bend Firewood — demo' })).toBeVisible();
});
