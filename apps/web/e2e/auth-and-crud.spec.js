import { expect, test } from '@playwright/test'

async function fillOtp(page, otp) {
  for (let index = 0; index < otp.length; index += 1) {
    await page.fill(`#otp-${index}`, otp[index])
  }
}

test('OTP giris ve temel CRUD akis', async ({ page }) => {
  const now = Date.now()
  const email = `e2e+${now}@example.com`
  const projectTitle = `E2E Proje ${now}`
  const taskTitle = `E2E Gorev ${now}`
  const comment = `E2E yorum ${now}`

  await page.goto('/login')
  const emailInput = page
    .locator('input[placeholder*="@sprintdock.com"], input[placeholder*="example.com"]')
    .first()
  await emailInput.fill(email)
  await page
    .getByRole('button', { name: /OTP Gonder|Send OTP|Tekrar Gonder|Resend/i })
    .first()
    .click()

  const otpMessage = page.locator('p', { hasText: /OTP \(gelistirme\):|OTP \(dev\):/ }).first()
  await expect(otpMessage).toBeVisible()
  const otpText = await otpMessage.textContent()
  const otp = otpText?.match(/(\d{6})/)?.[1]
  expect(otp).toBeTruthy()

  await fillOtp(page, otp)
  await page.getByRole('button', { name: /Dogrula ve Giris Yap|Verify & Login/i }).click()

  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.getByRole('heading', { name: /Projeler|Projects/i })).toBeVisible()

  await page.getByRole('button', { name: /Yeni Proje|New Project/i }).click()
  await page.getByPlaceholder(/Proje basligi|Project title/i).fill(projectTitle)
  await page.getByPlaceholder(/Proje aciklamasi|Project description/i).fill('E2E otomasyon akisi')
  await page.getByRole('button', { name: /Proje Olustur|Create Project/i }).click()
  await expect(page.locator('table')).toContainText(projectTitle)

  const projectOpenHref = await page
    .locator('table tbody tr')
    .first()
    .getByRole('link', { name: /^(Ac|Open)$/i })
    .getAttribute('href')
  expect(projectOpenHref).toBeTruthy()
  await page.goto(projectOpenHref)
  await expect(page).toHaveURL(/\/projects\/.+/)

  await page.getByRole('button', { name: /Yeni Gorev|New Task/i }).click()
  await page.getByPlaceholder(/Gorev basligi|Task title/i).fill(taskTitle)
  await page.getByPlaceholder(/Gorev aciklamasi|Task description/i).fill('E2E gorev aciklamasi')
  await page.getByRole('button', { name: /Gorev Olustur|Create Task/i }).click()
  await expect(page.getByRole('link', { name: taskTitle }).first()).toBeVisible()

  const taskHref = await page.getByRole('link', { name: taskTitle }).first().getAttribute('href')
  expect(taskHref).toBeTruthy()
  await page.goto(taskHref)
  await expect(page).toHaveURL(/\/tasks\/.+/)

  await page.getByPlaceholder(/Yorum ekleyin|Add a comment/i).fill(comment)
  await page.getByRole('button', { name: /Yorum Yap|Comment/i }).click()
  await expect(page.getByText(comment)).toBeVisible()
})
