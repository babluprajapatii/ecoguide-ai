import { test, expect } from '@playwright/test';

test.describe('EcoGuide AI End-to-End User Journey', () => {
  test('should allow a user to sign up, take assessment, view coach recommendations, run simulator, and opt-in to community standings', async ({
    page,
  }) => {
    // 1. Go to homepage / landing page
    await page.goto('/');
    await expect(page).toHaveTitle(/EcoGuide AI/);

    // 2. Locate navigation / auth trigger
    const startCta = page.getByRole('button', { name: /Meet My AI Coach|Get Started/i }).first();
    if (await startCta.isVisible()) {
      await startCta.click();
    }

    // Direct navigation to assessment flow
    await page.goto('/assessment');

    // Proceed past the welcome/start step if visible
    const startAssessmentButton = page.getByRole('button', { name: /Start Assessment/i });
    try {
      await startAssessmentButton.waitFor({ state: 'visible', timeout: 5000 });
      for (let i = 0; i < 5; i++) {
        await startAssessmentButton.click();
        await page.waitForTimeout(500);
        if (!(await startAssessmentButton.isVisible())) {
          break;
        }
      }
    } catch {
      console.log(
        'Start Assessment button not found or visible, assuming already on Transport step',
      );
    }

    // 3. Complete Assessment Wizard
    // Step 1: Transport
    await page.locator('#fuelType').selectOption('petrol');
    await page.locator('#weeklyKm').fill('150');
    await page.locator('#publicTransportWeeklyHours').fill('5');
    await page.locator('#rideShareWeeklyKm').fill('20');
    await page.getByRole('button', { name: /Next/i }).click();

    // Step 2: Energy
    await page.locator('#electricity').fill('350');
    await page.locator('#gas').fill('120');
    await page.locator('#renewable').fill('20');
    await page.locator('#homeSize').fill('1500');
    await page.locator('#members').fill('3');
    await page.getByRole('button', { name: /Next/i }).click();

    // Step 3: Diet
    await page
      .getByText(/Vegan|Vegetarian|Mixed|Meat-Heavy/i)
      .first()
      .click();
    await page.getByRole('button', { name: /Next/i }).click();

    // Step 4: Shopping
    await page
      .getByText(/Low|Medium|High/i)
      .first()
      .click();
    await page.getByRole('button', { name: /Next/i }).click();

    // Step 5: Travel
    await page.locator('#flightsPerYear').fill('2');
    await page.locator('#avgDistanceKm').fill('1000');
    await page.locator('#hotelStaysPerYear').fill('5');
    await page.getByRole('button', { name: /Submit|Next/i }).click();

    // Step 6: Review & Submit Assessment
    const submitBtn = page.getByRole('button', { name: /Submit Assessment/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // 4. View results page/dashboard
    await expect(page.locator('h2').first()).toContainText(/Carbon Footprint/i);

    // 5. Navigate to AI Coach Page
    await page.goto('/coach');
    await expect(page.locator('h1')).toContainText(/Coach|AI Assistant/i);

    // Check default recommendations seeded
    await expect(page.locator('.recommendation-card')).toHaveCount(3);

    // Complete a recommendation
    await page
      .getByRole('button', { name: /Complete/i })
      .first()
      .click();

    // 6. Navigate to Simulator
    await page.goto('/simulator');
    await expect(page.locator('h1')).toContainText(/Simulator|Scenario/i);

    // Run custom configuration
    await page.locator('#scenario-name').fill('My Green Plan');
    await page.getByRole('button', { name: /Run|Simulate/i }).click();
    await page.getByRole('button', { name: /Save/i }).click();

    // 7. Navigate to Community Standings
    await page.goto('/community');
    await expect(page.locator('h1')).toContainText(/Community/i);

    // Join community if not opted in
    const joinButton = page.getByRole('button', { name: /Join Community/i });
    try {
      await joinButton.waitFor({ state: 'visible', timeout: 3000 });
      for (let i = 0; i < 3; i++) {
        await joinButton.click();
        await page.waitForTimeout(500);
        if (!(await joinButton.isVisible())) {
          break;
        }
      }
    } catch {
      console.log('Join Community button not visible, assuming already joined');
    }
    await expect(page.locator('table')).toBeVisible();

    // 8. Log out — open profile dropdown then click Log Out
    await page.goto('/settings');
    // The Log Out button is inside a profile dropdown in the header
    // The dropdown trigger has aria-haspopup="true"
    const profileDropdownTrigger = page.locator('[aria-haspopup="true"]').last();
    await profileDropdownTrigger.waitFor({ state: 'visible', timeout: 8000 });
    await profileDropdownTrigger.click();
    // Now the dropdown menu is open — click the Log Out button
    const logoutBtn = page.getByRole('button', { name: /Log Out/i });
    await logoutBtn.waitFor({ state: 'visible', timeout: 5000 });
    await logoutBtn.click();
    // After signout, navigate to landing and verify it loads
    await page.goto('/');
    await expect(page).toHaveTitle(/EcoGuide AI/);
  });
});
