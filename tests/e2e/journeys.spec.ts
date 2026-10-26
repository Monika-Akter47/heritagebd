import { expect, test, type Page } from '@playwright/test';

// System / E2E journeys (use-case scenarios from the SRS use-case diagram), run on Edge, Firefox and a
// mobile viewport against the local test stack seeded from backend/database/postgres/seed.sql.
// Seed accounts use the fixture password; they exist only in the throwaway test database.
const PASSWORD = 'password123';

async function login(page: Page, email: string, role: 'tourist' | 'vendor' | 'guide' | 'admin') {
  await page.goto('/login');
  await page.getByRole('button', { name: role, exact: true }).click();   // "Sign in as" selector
  await page.locator('input[type="email"]').fill(email);
  await page.getByPlaceholder('Enter your password').fill(PASSWORD);
  await page.locator('form button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login/);
}

// E2E-01 | FR-11, FR-12, FR-13 | System | Use case | P1 | +
test('E2E-01 map shows heritage places, layer toggles and marker card links to the place', async ({ page }) => {
  // Places and guides load separately; count only once both API calls have finished.
  const placesLoaded = page.waitForResponse(r => r.url().includes('/api/places') && r.ok());
  const guidesLoaded = page.waitForResponse(r => r.url().includes('/api/guides') && r.ok());
  await page.goto('/map');
  await Promise.all([placesLoaded, guidesLoaded]);
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible({ timeout: 20_000 });
  await page.waitForLoadState('networkidle');
  const withPlaces = await page.locator('.leaflet-marker-icon').count();
  expect(withPlaces).toBeGreaterThanOrEqual(12);                      // 12 seed places (FR-11)

  await page.getByText('Heritage Places', { exact: true }).click();     // hide the layer (FR-12)
  await expect.poll(() => page.locator('.leaflet-marker-icon').count()).toBeLessThan(withPlaces);
  await page.getByText('Heritage Places', { exact: true }).click();
  await expect.poll(() => page.locator('.leaflet-marker-icon').count()).toBe(withPlaces);

  await page.locator('.leaflet-marker-icon').first().click({ force: true });   // marker card (FR-13)
  const details = page.getByRole('link', { name: /View (Place|Guide) Details/ });
  await expect(details).toBeVisible();
  await details.click();
  await expect(page).toHaveURL(/\/(places|guides)\//);
});

// E2E-02 | FR-27, FR-28, FR-29, FR-30 | System | Use case | P1 | +
test('E2E-02 tourist pre-orders with bKash proof and gets an order number', async ({ page }) => {
  await login(page, 'tourist@heritagebd.com', 'tourist');
  await page.goto('/preorder/checkout?product=po-5&destination=Sonargaon');
  await page.getByRole('button', { name: 'Continue to Order Summary' }).click();
  await page.getByRole('button', { name: 'Proceed to Payment' }).click();

  await expect(page.getByText('Payment Breakdown')).toBeVisible();
  const pay = page.getByRole('button', { name: /^Pay ৳[\d,]+ & Confirm Pre-Order$/ });

  await pay.click();                                                    // no proof yet → blocked client-side
  await expect(page.getByText('Enter the bKash number the payment was sent from.')).toBeVisible();

  await page.getByLabel('Your bKash number').fill('01712345678');
  await page.getByLabel('Transaction ID (TrxID)').fill('E2E7XK2L5M');
  await pay.click();
  await expect(page.getByText(/HB\d{6}[A-Z0-9]{5}/).first()).toBeVisible({ timeout: 20_000 });
});

// E2E-03 | FR-45 | System | Use case | P1 | +
test('E2E-03 admin sees advances with payer number and TrxID on Payments & Advances', async ({ page }) => {
  await login(page, 'admin@heritagebd.com', 'admin');
  await page.goto('/admin?section=payments');
  await expect(page.getByText('Advances Collected')).toBeVisible();
  await expect(page.getByRole('cell', { name: /HB1020|ORD-2024-001/ }).first()).toBeVisible();   // seed payments listed

  await page.getByLabel('Filter by flow').selectOption('preorder');
  const rows = page.locator('tbody tr');
  await expect(rows.first()).toBeVisible();
  for (const text of await rows.allInnerTexts()) expect(text).toContain('Pre-order');
});
