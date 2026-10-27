import { expect, test } from '@playwright/test';

test('autentica no Django real e carrega catálogo e agenda', async ({ page }) => {
  test.skip(process.env.E2E_REAL !== 'true' || !process.env.E2E_EMAIL || !process.env.E2E_PASSWORD, 'Requer E2E_REAL, E2E_EMAIL e E2E_PASSWORD');
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

  await page.goto('login');
  await page.getByLabel('E-mail').fill(process.env.E2E_EMAIL);
  await page.getByLabel('Senha').fill(process.env.E2E_PASSWORD);
  await page.getByRole('button', { name: /Acessar painel/ }).click();
  await expect(page.getByText('Visão geral')).toBeVisible();

  await page.getByRole('link', { name: /Produtos/ }).click();
  await expect(page.getByText(/Produtos|Nenhum produto|Carregando produtos/).first()).toBeVisible();
  await page.getByRole('link', { name: /Agendamentos/ }).click();
  await expect(page.getByText(/Agendamentos|Nenhum agendamento|Carregando agendamentos/).first()).toBeVisible();
  await page.getByRole('link', { name: /Metas/ }).click();
  await expect(page.getByText(/Metas|Nenhuma meta|Carregando metas/).first()).toBeVisible();

  expect(errors, errors.join('\n')).toEqual([]);
});
