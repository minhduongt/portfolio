// Browser checks must not inflate production visit counts.
export async function mockVisitorTracking(page) {
  await page.route('**/api/v1/visitors/**', route => route.fulfill({
    json: { success: true, data: route.request().url().includes('/stats') ? { activeVisitors: 1, totalVisits: 1 } : { countedVisit: false } },
  }));
}
