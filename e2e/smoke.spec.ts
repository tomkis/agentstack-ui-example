import { test, expect } from '@playwright/test';

test('app loads successfully', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});

test('chat UI renders correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'AgentStack Chat' })).toBeVisible();
  await expect(page.getByTestId('chat-input')).toBeVisible();
  await expect(page.getByTestId('send-button')).toBeVisible();
});

test('user can send a message', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('chat-input').fill('Hello agent');
  await page.getByTestId('send-button').click();
  await expect(page.getByTestId('chat-bubble-user')).toBeVisible();
  await expect(page.getByTestId('chat-bubble-user')).toContainText('Hello agent');
});

test('agent responds to message', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('chat-input').fill('Hi');
  await page.getByTestId('send-button').click();
  await expect(page.getByTestId('chat-bubble-user')).toContainText('Hi');
  await expect(page.getByTestId('chat-bubble-agent')).toBeVisible({ timeout: 30000 });
  const agentBubble = page.getByTestId('chat-bubble-agent');
  await expect(agentBubble).not.toBeEmpty({ timeout: 30000 });
});

test('displays actual error message on failure', async ({ page }) => {
  await page.route('**/api/v1/a2a/**', route => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    });
  });
  await page.goto('/');
  await page.getByTestId('chat-input').fill('Test error');
  await page.getByTestId('send-button').click();
  await expect(page.getByTestId('chat-bubble-user')).toContainText('Test error');
  const agentBubble = page.getByTestId('chat-bubble-agent');
  await expect(agentBubble).toBeVisible({ timeout: 10000 });
  await expect(agentBubble).toContainText('Error:');
  await expect(agentBubble).not.toContainText('Failed to get response from agent');
});

