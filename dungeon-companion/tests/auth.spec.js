import { test, expect } from '@playwright/test';

// ข้อมูลสำหรับใช้ในการทดสอบ
const testUser = {
  username: `testuser${Date.now()}`,
  email: `testuser${Date.now()}@example.com`,
  password: 'Password123'
};

test.describe.serial('Authentication Tests (TF-AUTH-001 ถึง TF-AUTH-003)', () => {

  test('TF-AUTH-001: ลงทะเบียนผู้ใช้ใหม่ด้วยข้อมูลถูกต้อง', async ({ page }) => {
    // ไปหน้าแรกและคลิกไปที่ Login/Register หรือถ้ามี Route เข้าได้โดยตรง
    await page.goto('http://localhost:5173');
    
    // ลองหาลิงก์/ปุ่มไปหน้า login หรือเปิด modal (ในที่นี้ขอลองไปที่ route /login)
    await page.goto('http://localhost:5173/login');
    
    // รอให้ปุ่ม CREATE ACCOUNT ขึ้นมาแสดง
    await expect(page.locator('button.auth-tab', { hasText: 'CREATE ACCOUNT' })).toBeVisible();
    await page.locator('button.auth-tab', { hasText: 'CREATE ACCOUNT' }).click();

    // กรอกฟอร์ม
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);

    // ยืนยันการสมัคร
    await page.locator('button.btn-auth-signup').click();

    // รอข้อความสำเร็จ
    const successMsg = page.locator('.auth-alert.success');
    await expect(successMsg).toBeVisible({ timeout: 5000 });
  });

  test('TF-AUTH-002: เข้าสู่ระบบด้วยบัญชีที่ถูกต้อง', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    await expect(page.locator('button.auth-tab', { hasText: 'SIGN IN' })).toBeVisible();
    await page.locator('button.auth-tab', { hasText: 'SIGN IN' }).click();

    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);

    await page.locator('button.btn-auth-submit').click();

    const successMsg = page.locator('.auth-alert.success');
    await expect(successMsg).toBeVisible({ timeout: 5000 });
  });

  test('TF-AUTH-003: ปฏิเสธ Login เมื่อรหัสผ่านผิด', async ({ page }) => {
    await page.goto('http://localhost:5173/login');

    await expect(page.locator('button.auth-tab', { hasText: 'SIGN IN' })).toBeVisible();
    await page.locator('button.auth-tab', { hasText: 'SIGN IN' }).click();

    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', 'WrongPassword123!');

    await page.locator('button.btn-auth-submit').click();

    const errorMsg = page.locator('.auth-alert.error');
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });

});
