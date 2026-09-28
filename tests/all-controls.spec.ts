import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';

function watchRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('every visible control completes its state transition', async ({ page }, testInfo) => {
  const errors = watchRuntimeErrors(page);
  const predict = page.getByRole('button', { name: 'Predict & trace' });
  const traceOnly = page.getByRole('button', { name: 'Trace without prediction' });
  const compare = page.getByRole('button', { name: 'Compare versions' });
  const exportReceipt = page.getByRole('button', { name: 'Export debug receipt' });

  await expect(page.getByRole('button')).toHaveCount(8);
  await expect(predict).toBeDisabled();
  await expect(traceOnly).toBeEnabled();
  await expect(compare).toBeDisabled();
  await expect(exportReceipt).toBeDisabled();

  const challenges = [
    {
      name: /The extra iteration/,
      title: 'The extra iteration',
      hint: /whether 5 itself passes the condition/,
      start: '0',
    },
    {
      name: /A countdown that climbs/,
      title: 'A countdown that climbs',
      hint: /make i smaller/,
      start: '5',
    },
    {
      name: /Every other number/,
      title: 'Every other number',
      hint: /increment changes immediately/,
      start: '0',
    },
  ];

  for (const challenge of challenges) {
    const button = page.getByRole('button', { name: challenge.name });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: challenge.title, exact: true })).toBeVisible();
    await expect(page.getByLabel('Original start', { exact: true })).toHaveValue(challenge.start);
    await page.getByText('A hint, if you need one').click();
    await expect(page.getByText(challenge.hint)).toBeVisible();
    await page.getByText('A hint, if you need one').click();
    await expect(page.getByText(challenge.hint)).toBeHidden();
  }

  // Exercise every editable input/select in both loop editors.
  const fieldChanges: Array<[string, string]> = [
    ['Original start', '1'],
    ['Original end', '8'],
    ['Original step', '2'],
    ['Alternative start', '1'],
    ['Alternative end', '9'],
    ['Alternative step', '3'],
  ];
  for (const [label, value] of fieldChanges) {
    await page.getByLabel(label, { exact: true }).fill(value);
    await expect(page.getByLabel(label, { exact: true })).toHaveValue(value);
  }
  await page.getByLabel('Original condition').selectOption('<=');
  await page.getByLabel('Original accumulation').selectOption('count');
  await page.getByLabel('Alternative condition').selectOption('<=');
  await page.getByLabel('Alternative accumulation').selectOption('count');
  await expect(page.getByLabel('Original condition')).toHaveValue('<=');
  await expect(page.getByLabel('Original accumulation')).toHaveValue('count');
  await expect(page.getByLabel('Alternative condition')).toHaveValue('<=');
  await expect(page.getByLabel('Alternative accumulation')).toHaveValue('count');
  await expect(page.getByText('Saved in this browser')).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Original start', { exact: true })).toHaveValue('1');
  await expect(page.getByLabel('Alternative step', { exact: true })).toHaveValue('3');
  await expect(page.getByLabel('Original condition')).toHaveValue('<=');
  await expect(page.getByLabel('Alternative accumulation')).toHaveValue('count');

  // Invalid input disables both run paths, then a valid prediction unlocks prediction mode.
  await page.getByLabel('Original step', { exact: true }).fill('');
  await expect(page.getByRole('alert')).toContainText('Enter an integer in every loop field');
  await expect(predict).toBeDisabled();
  await expect(traceOnly).toBeDisabled();
  await page.getByLabel('Original step', { exact: true }).fill('2');
  await page.getByLabel('Your predicted total').fill('4');
  await expect(predict).toBeEnabled();
  await predict.click();

  const previous = page.getByRole('button', { name: 'Previous step' });
  const next = page.getByRole('button', { name: 'Next step', exact: true });
  const finish = page.getByRole('button', { name: 'Finish trace' });
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  await expect(finish).toBeEnabled();
  await next.click();
  await expect(previous).toBeEnabled();
  await previous.click();
  await expect(previous).toBeDisabled();
  await finish.click();
  await expect(next).toBeDisabled();
  await expect(finish).toBeDisabled();
  await expect(page.getByText(/Your prediction: 4\. Observed total:/)).toBeVisible();
  await expect(compare).toBeEnabled();

  // The no-prediction path is a separate button and should omit prediction copy.
  await traceOnly.click();
  await finish.click();
  await expect(page.getByText(/Your prediction:/)).toHaveCount(0);
  await compare.click();
  await expect(page.getByText('THE EVIDENCE', { exact: true })).toBeVisible();
  await expect(exportReceipt).toBeEnabled();

  const downloadEvent = page.waitForEvent('download');
  await exportReceipt.click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('looplens-debug-receipt.md');
  const body = await fs.readFile((await download.path())!, 'utf8');
  expect(body).toContain('# LoopLens learning receipt');
  expect(body).toContain('No prediction recorded.');
  await expect(page.getByText('Debug receipt downloaded.')).toBeVisible();

  await page.getByRole('button', { name: 'Reset workspace' }).click();
  await expect(page.getByRole('button', { name: /The extra iteration/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Original start', { exact: true })).toHaveValue('0');
  await expect(page.getByLabel('Original end', { exact: true })).toHaveValue('5');
  await expect(page.getByLabel('Original step', { exact: true })).toHaveValue('1');
  await expect(page.getByLabel('Your predicted total')).toHaveValue('');
  await page.reload();
  await expect(page.getByLabel('Original start', { exact: true })).toHaveValue('0');
  await expect(page.getByLabel('Alternative condition')).toHaveValue('<=');

  await expectNoHorizontalOverflow(page);
  expect(errors, `${testInfo.project.name} emitted browser runtime errors`).toEqual([]);
});

test('zero-iteration trace keeps all trace controls safe', async ({ page }, testInfo) => {
  const errors = watchRuntimeErrors(page);
  await page.getByLabel('Original start', { exact: true }).fill('5');
  await page.getByLabel('Original end', { exact: true }).fill('0');
  await page.getByLabel('Original condition').selectOption('<');
  await page.getByRole('button', { name: 'Trace without prediction' }).click();

  await expect(page.getByText('No iterations: the initial condition is false.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous step' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Next step', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Finish trace' })).toBeDisabled();
  await expect(page.getByText('Trace complete')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Compare versions' })).toBeEnabled();
  await expectNoHorizontalOverflow(page);
  expect(errors, `${testInfo.project.name} emitted browser runtime errors`).toEqual([]);
});
