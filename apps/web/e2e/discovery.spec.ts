import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://maps.geoapify.com/**', route => route.fulfill({ json: {
    version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#eaf0e3' } }]
  } }));
});

test('discovery defaults to Southern Maine and ten miles without requesting location', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = () => { throw new Error('Unexpected location request'); };
  });
  await page.route('**/api/stands?**', route => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get('latitude')).toBe('43.68');
    expect(url.searchParams.get('radiusMiles')).toBe('10');
    return route.fulfill({ json: { items: [], truncated: false } });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Find firewood near you.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No listed stands within 10 miles' })).toBeVisible();
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Stand map' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('nearby failures can retry and radius widening requests new results', async ({ page }) => {
  let fail = true;
  await page.route('**/api/stands?**', route => fail
    ? route.fulfill({ status: 503 }) : route.fulfill({ json: { items: [], truncated: false } }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('couldn’t load nearby stands');
  fail = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'No listed stands within 10 miles' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Within' }).selectOption('25');
  await expect(page.getByRole('heading', { name: 'No listed stands within 25 miles' })).toBeVisible();
});

test('denied location leaves destination search and manual browsing available', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_success, failure) => failure?.({ code: 1, message: 'Denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
  });
  await page.route('**/api/stands?**', route => route.fulfill({ json: { items: [], truncated: false } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Use my location' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'We couldn’t access your location' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Where are you headed?' })).toBeEnabled();
});

test('destination selection searches its coordinates and displays matching list and map', async ({ page }) => {
  await page.route('https://api.geoapify.com/**', route => route.fulfill({ json: { results: [
    { formatted: 'Sebago Lake State Park, Maine', lat: 43.929, lon: -70.58 }
  ] } }));
  await page.route('**/api/stands?**', route => {
    const url = new URL(route.request().url());
    return route.fulfill({ json: { items: url.searchParams.get('latitude') === '43.929' ? [{ distanceMiles: 1.2, stand: {
      id: '11111111-1111-4111-8111-111111111111', name: 'Example roadside stand', town: 'Casco', state: 'ME',
      latitude: 43.93, longitude: -70.59, price: null, operatingStatus: 'active', isDemo: true
    } }] : [], truncated: false } });
  });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Where are you headed?' }).fill('Sebago Lake State Park');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: 'Sebago Lake State Park, Maine' }).click();
  await expect(page.getByRole('link', { name: 'Example roadside stand' })).toBeVisible();
  await expect(page.getByText('Casco, ME · 1.2 miles straight-line')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Search this area' })).toBeVisible();
  await page.screenshot({ path: `test-results/discovery-${test.info().project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Example roadside stand' })).toBeVisible();
});

test('provider search failures are explained without removing existing discovery', async ({ page }) => {
  await page.route('https://api.geoapify.com/**', route => route.fulfill({ status: 429 }));
  await page.route('**/api/stands?**', route => route.fulfill({ json: { items: [], truncated: false } }));
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Where are you headed?' }).fill('Portland');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByText('Destination search is unavailable. Please try again.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nearby stands' })).toBeVisible();
});
