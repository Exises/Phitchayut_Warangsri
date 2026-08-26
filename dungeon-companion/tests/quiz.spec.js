import { test, expect } from '@playwright/test';

test.describe.serial('Personality Quiz Tests (TF-REC-001 ถึง TF-REC-003)', () => {
  test('TF-REC-001: ทำแบบทดสอบจนจบและแสดงผลได้', async ({ page }) => {
    // 1. เปิดหน้า Class Test
    await page.goto('http://localhost:5173/class-test');
    
    // 2. กดปุ่มเริ่มทดสอบ (โหมดปรนัย)
    await page.getByText('โหมดปรนัย (Standard Quiz)').click();

    // 3. วนลูปตอบคำถามจนกว่าจะถึงหน้าจบ
    // ระบบมี 10 ข้อ จะตอบข้อแรกของทุกคำถามไปเรื่อยๆ
    for (let i = 0; i < 10; i++) {
      // รอให้ปุ่มคำตอบโหลด
      await page.waitForSelector('.quiz-choice-btn');
      
      // ดึงปุ่มคำตอบทั้งหมด
      const choices = await page.locator('.quiz-choice-btn').all();
      
      // คลิกตัวเลือกแรกเสมอ
      if (choices.length > 0) {
        await choices[0].click();
      }
      
      // ถ้ามีการเปลี่ยนหน้า (รอสั้นๆ ให้ DOM อัปเดต)
      await page.waitForTimeout(300);
    }

    // 4. ตรวจสอบว่าหน้าจอแสดงผลลัพธ์ (Result)
    // ควรมี "YOUR DESTINY"
    await expect(page.getByText('YOUR DESTINY')).toBeVisible({ timeout: 10000 });
    
    // 5. ตรวจสอบว่ามีอันดับ 1, 2, 3 ครบถ้วน (TF-REC-002: แสดง 3 อันดับแรก)
    await expect(page.getByText('อันดับ 1 (BEST MATCH)')).toBeVisible();
    await expect(page.getByText('อันดับ 2 (ALTERNATIVE)')).toBeVisible();
    await expect(page.getByText('อันดับ 3 (WILDCARD)')).toBeVisible();

    // ตรวจสอบชื่อคลาสที่ได้
    const topClass = page.locator('.result-class-name-main');
    await expect(topClass).toBeVisible();
    const className = await topClass.textContent();
    console.log('Top Class Result:', className);
    expect(className).toBeTruthy(); // ต้องมีชื่อคลาสแสดง
  });
});
