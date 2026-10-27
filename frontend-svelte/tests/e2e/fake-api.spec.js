import { expect, test } from '@playwright/test';

async function login(page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('admin@prover.com');
  await page.getByLabel('Senha').fill('123456');
  await page.getByRole('button', { name: /Acessar painel/ }).click();
  await page.waitForURL('**/', { timeout: 15_000 });
  await expect(page.getByText('Visão geral')).toBeVisible({ timeout: 15_000 });
}

test('protege rotas e abre o modal de produtos', async ({ page }) => {
  await page.goto('/products');
  await expect(page).toHaveURL(/\/login\/?$/);
  await login(page);
  await page.getByRole('link', { name: /Produtos/ }).click();
  await page.getByRole('button', { name: /Novo produto/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('cria agendamento e meta usando a API fake', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: /Agendamentos/ }).click();
  await page.getByRole('button', { name: /Novo agendamento/ }).click();
  await page.getByLabel('Cliente *').selectOption('client-001');
  await page.getByLabel('Serviço *').selectOption('service-001');
  await page.getByLabel('Data e hora *').fill('2026-12-25T12:00');
  await page.getByRole('button', { name: 'Criar agendamento' }).click();
  await expect(page.getByText('Mariana Costa').first()).toBeVisible();

  await page.getByRole('link', { name: /Metas/ }).click();
  await page.getByRole('button', { name: /Nova meta/ }).click();
  await page.getByLabel('Título *').fill('Meta E2E');
  await page.getByLabel('Valor da meta *').fill('1000');
  await page.getByRole('button', { name: 'Criar meta' }).click();
  await expect(page.getByText('Meta E2E')).toBeVisible();
});

test('exporta dashboard e vendas em CSV', async ({ page }) => {
  await login(page);
  const dashboardDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: /Exportar relatório/ }).click();
  await expect((await dashboardDownload).suggestedFilename()).toMatch(/\.csv$/);
  await page.getByRole('link', { name: /Vendas/ }).click();
  const salesDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: /Exportar dados/ }).click();
  await expect((await salesDownload).suggestedFilename()).toMatch(/\.csv$/);
});
