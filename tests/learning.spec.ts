import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

test('predict, step, compare, and download reproducible evidence', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByLabel('Your predicted total').fill('15');
  await page.getByRole('button', { name: 'Predict & trace' }).click();
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Iteration trace' }).getByRole('row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Finish trace' }).click();
  await expect(page.getByText('Your prediction: 15. Observed total: 10.')).toBeVisible();
  await page.getByRole('button', { name: 'Compare versions' }).click();
  await expect(page.getByRole('heading', { name: 'First difference: iteration 6' })).toBeVisible();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export debug receipt' }).click();
  const download = await downloadEvent;
  const body = await fs.readFile((await download.path())!, 'utf8');
  expect(body).toContain('First difference at iteration 6');
  expect(body).toContain('Final total: **10**');
  expect(body).toContain('Final total: **15**');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('custom loop persists and invalid inputs block execution', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Original start', { exact: true }).fill('2');
  await page.reload();
  await expect(page.getByLabel('Original start', { exact: true })).toHaveValue('2');
  await page.getByLabel('Original step', { exact: true }).fill('');
  await expect(page.getByRole('button', { name: 'Trace without prediction' })).toBeDisabled();
  await page.getByRole('button', { name: 'Reset workspace' }).click();
  await expect(page.getByLabel('Original start', { exact: true })).toHaveValue('0');
});

test('nonterminating preview never claims a final result', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /A countdown that climbs/ }).click();
  await page.getByRole('button', { name: 'Trace without prediction' }).click();
  await page.getByRole('button', { name: 'Finish trace' }).click();
  await expect(page.getByText('Trace stopped, result incomplete')).toBeVisible();
  await expect(page.getByText(/does not terminate in this integer model/)).toBeVisible();
  await page.getByRole('button', { name: 'Compare versions' }).click();
  await expect(page.getByText('Original partial total')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'First difference: iteration 1' })).toBeVisible();
});

test('corrupt saved content is reported and preserved until an explicit edit', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('looplens.session.v1', '{bad'));
  await page.reload();
  await expect(page.getByText(/Saved session could not be read/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('looplens.session.v1'))).toBe('{bad');
  await page.getByRole('button', { name: 'Reset workspace' }).click();
  await expect(page.getByText('Saved in this browser')).toBeVisible();
});
