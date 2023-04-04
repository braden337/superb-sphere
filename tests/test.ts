import { page } from '$app/stores';
import { expect, test } from '@playwright/test';

test('renders [Locate Me] button', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Locate Me' })).toBeVisible();
});

test('renders [Locate Me] button when passed invalid +code', async ({ page }) => {
  await page.goto('/#12345678+90');
  await expect(page.getByRole('button', { name: 'Locate Me' })).toBeVisible();
});

test('renders [Waze] button when passed valid +code', async ({ page }) => {
  await page.goto('/#86x4rv66+99');
  await expect(page.getByRole('button', { name: 'Waze' })).toBeVisible();
});

test('renders [Apple Maps] button when passed valid +code', async ({ page }) => {
  await page.goto('/#86x4rv66+99');
  await expect(page.getByRole('button', { name: 'Apple Maps' })).toBeVisible();
});

test('renders [Google Maps] button when passed valid +code', async ({ page }) => {
  await page.goto('/#86x4rv66+99');
  await expect(page.getByRole('button', { name: 'Google Maps' })).toBeVisible();
});
