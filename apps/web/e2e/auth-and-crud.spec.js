import { expect, test } from '@playwright/test'

async function fillOtp(page, otp) {
  for (let index = 0; index < otp.length; index += 1) {
    await page.fill(`#otp-${index}`, otp[index])
  }
}

test('OTP sign in ve temel CRUD akis', async ({ page }) => {
  const now = Date.now()
  const email = `e2e+${now}@example.com`
  const projectTitle = `E2E Project ${now}`
  const taskTitle = `E2E Task ${now}`
  const comment = `E2E comment ${now}`

  await page.goto('/login')
  const emailInput = page
    .locator('input[placeholder*="@sprintdock.com"], input[placeholder*="example.com"]')
    .first()
  await emailInput.fill(email)
  await page
    .getByRole('button', { name: /Send OTP|Send OTP|Tekrar Gonder|Resend/i })
    .first()
    .click()

  const otpMessage = page.locator('p', { hasText: /OTP \(gelistirme\):|OTP \(dev\):/ }).first()
  await expect(otpMessage).toBeVisible()
  const otpText = await otpMessage.textContent()
  const otp = otpText?.match(/(\d{6})/)?.[1]
  expect(otp).toBeTruthy()

  await fillOtp(page, otp)
  await page.getByRole('button', { name: /Verify & Login|Verify & Login/i }).click()

  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.getByRole('heading', { name: /Projects|Projects/i })).toBeVisible()

  await page.getByRole('button', { name: /New Project|New Project/i }).click()
  await page.getByPlaceholder(/Project title|Project title/i).fill(projectTitle)
  await page.getByPlaceholder(/Project aciklamasi|Project description/i).fill('E2E automation flow')
  await page.getByRole('button', { name: /Project Olustur|Create Project/i }).click()
  await expect(page.locator('table')).toContainText(projectTitle)

  const projectOpenHref = await page
    .locator('table tbody tr')
    .first()
    .getByRole('link', { name: /^(Open|Open)$/i })
    .getAttribute('href')
  expect(projectOpenHref).toBeTruthy()
  await page.goto(projectOpenHref)
  await expect(page).toHaveURL(/\/projects\/.+/)

  await page.getByRole('button', { name: /New Task|New Task/i }).click()
  await page.getByPlaceholder(/Task title|Task title/i).fill(taskTitle)
  await page.getByPlaceholder(/Task aciklamasi|Task description/i).fill('E2E tasks aciklamasi')
  await page.getByRole('button', { name: /Create Task|Create Task/i }).click()
  await expect(page.getByRole('link', { name: taskTitle }).first()).toBeVisible()

  const taskHref = await page.getByRole('link', { name: taskTitle }).first().getAttribute('href')
  expect(taskHref).toBeTruthy()
  await page.goto(taskHref)
  await expect(page).toHaveURL(/\/tasks\/.+/)

  await page.getByPlaceholder(/Comment ekleyin|Add a comment/i).fill(comment)
  await page.getByRole('button', { name: /Comment|Comment/i }).click()
  await expect(page.getByText(comment)).toBeVisible()
})
