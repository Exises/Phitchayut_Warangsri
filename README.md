# กล่องเครื่องมือดันเจียนออนไลน์ (Dungeon Toolkit)
### A Web Application for Tabletop RPGs (D&D 5th Edition)

![React](https://img.shields.io/badge/React-18%2F19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-3D_Dice-000000?style=for-the-badge&logo=three.js&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)

---

## เกี่ยวกับโครงงาน (About The Project)

**กล่องเครื่องมือดันเจียนออนไลน์ (Dungeon Toolkit)** เป็นเว็บแอปพลิเคชันสำหรับอำนวยความสะดวกในการเล่นเกมสวมบทบาทบนโต๊ะ (Tabletop Role-Playing Games: TRPGs) โดยเฉพาะระบบกติกา **Dungeons & Dragons 5th Edition (D&D 5e)** พัฒนาขึ้นเพื่อแก้ไขปัญหาความยุ่งยากในการเปิดค้นหากฎจากหนังสือคู่มือหนาหลายร้อยหน้า ลดข้อผิดพลาดในการคำนวณค่าสถานะและสเตตัส และทดแทนการจดบันทึกลงบนแผ่นตัวละครกระดาษที่ฉีกขาดหรือสูญหายง่าย

เว็บแอปพลิเคชันนี้ทำงานในรูปแบบ **Single Page Application (SPA)** บนเครื่องคอมพิวเตอร์และเบราว์เซอร์ รวมศูนย์เครื่องมือช่วยเล่นแบบดิจิทัลครบวงจร ตั้งแต่การแนะนำอาชีพด้วย AI, ผู้ช่วยสร้างตัวละครตามลำดับขั้นตอน, แผ่นตัวละครแบบพลวัต (Live Character Sheet) ที่ปรับค่าพลังชีวิตและสเปลสล็อตได้แบบเรียลไทม์, ระบบจำลองลูกเต๋า 3 มิติพร้อมฟิสิกส์เสมือนจริง 60 FPS, คลังข้อมูลสารสนเทศกฎมาตรฐาน (SRD) ตลอดจนระบบจัดการหลังบ้านสำหรับผู้ดูแลระบบ (Admin Dashboard)

**วิดีโอแนะนำโปรเจต**
Google Drive
https://drive.google.com/file/d/1yvH5ao3lPDD7TZVEg3bVgSyPvAI4iWpK/view?usp=sharing
Youtube
https://youtu.be/p1R9tDQHSSI

>  **โครงงานปริญญานิพนธ์ระดับปริญญาตรี**  
> **ผู้จัดทำ:** นายพิชญุตม์ วะรังศรี (รหัสนิสิต 6640206709)  
> **อาจารย์ที่ปรึกษาหลัก:** ผู้ช่วยศาสตราจารย์ ดร.ศศิธร สุชัยยะ  
> **อาจารย์ที่ปรึกษาร่วม:** ผู้ช่วยศาสตราจารย์วไลลักษณ์ วงษ์รื่น  
> **สังกัด:** ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ คณะวิทยาศาสตร์และวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร

---

## ฟังก์ชันและความสามารถเด่นของระบบ (Core Features)

### 1. ระบบส่วนติดต่อผู้ใช้งาน (Frontend Functions)
* **ยืนยันตัวตนและจัดการสิทธิ์ (Authentication & Roles):**
  * ระบบลงทะเบียนและเข้าสู่ระบบ แยกแยะสิทธิ์ความเป็นเจ้าของข้อมูลตัวละคร
  * ระบบกู้คืนรหัสผ่านผ่านอีเมล (SMTP Nodemailer)
  * หน้าโปรไฟล์แก้ไขข้อมูลส่วนตัว อัปโหลดภาพ Avatar และเปลี่ยนรหัสผ่าน
* **ผู้ช่วยสร้างตัวละคร 7 ขั้นตอน (Character Creation Wizard):**
  * นำทางสร้างตัวละครทีละขั้นตอนตามกฎ D&D 5e (เผ่าพันธุ์ Race, อาชีพ Class, ภูมิหลัง Background, อุปกรณ์)
  * **Rule Engine คำนวณอัตโนมัติ:** คำนวณ Ability Modifiers $\lfloor(Score - 10) / 2\rfloor$, พลังชีวิตเริ่มต้น (Base HP), Armor Class (AC), และความชำนาญ (Skills/Proficiencies)
* **แผ่นข้อมูลตัวละครแบบพลวัต (Dynamic Character Sheet):**
  * **Live Status Tracking:** ปรับเพิ่ม/ลดพลังชีวิตปัจจุบัน (Current HP), Temporary HP
  * **Death Saving Throws:** เมื่อ HP $\le 0$ ระบบจะสลับเข้าสู่โหมดลุ้นรอดชีวิต ทอยเต๋า d20 บันทึกผล Success / Failure อย่างละ 3 ช่องอัตโนมัติ
  * **Resource Management:** จัดการช่องเวทมนตร์ (Spell Slots Level 1–9) และฟังก์ชันพักผ่อน (Short Rest / Long Rest) เพื่อรีเซ็ตค่าสถานะ
  * **Inventory & Encumbrance:** จัดการสิ่งของในกระเป๋า พร้อมคำนวณน้ำหนักรวมเทียบกับขีดจำกัดพลังกาย ($STR \times 15$ lbs)
  * **Digital Journal:** สมุดบันทึกดิจิทัลสำหรับจดบันทึกเหตุการณ์และเควสต์ (Quest) ระหว่างเล่น
* **ลูกเต๋า 3 มิติเสมือนจริง (3D Physics Dice Roller):**
  * จำลองการทอยลูกเต๋า 3 มิติ (d4, d6, d8, d10, d12, d20, d100) ผ่าน WebGL Canvas ด้วยความเร็ว 60 FPS
  * มีระบบฟิสิกส์จำลองแรงกระทบ แรงหมุน และอ่านค่าหน้าเต๋าที่หงายขึ้นมาประมวลผลการโจมตีอัตโนมัติ
* **ระบบแนะนำอาชีพ 2 รูปแบบ (Class Recommendation):**
  * **Personality Quiz:** แบบทดสอบจิตวิทยา 6 หมวดคำถาม ประมวลผลด้วยคะแนนถ่วงน้ำหนัก (Weighted Scoring) แนะนำอาชีพที่เหมาะที่สุด 3 อันดับแรก
  * **AI Dungeon Master (Gemini):** คุยโต้ตอบกับ AI DM จำลองสถานการณ์การผจญภัย เพื่อวิเคราะห์คลาสที่เข้ากับบุคลิกของผู้เล่นอย่างลึกซึ้ง
* **คลังข้อมูลสารสนเทศกฎมาตรฐาน (SRD Compendium):**
  * รวบรวมข้อมูลมาตรฐาน 5e มากกว่า 840 รายการ (Spells, Items, Monsters, Classes, Species, Feats)
  * ค้นหาทันใจแบบ **Live Search** พร้อมระบบ **Advanced Filtering** คัดกรองตามระดับเลเวลและความหายาก
* **ระบบรับฟังความคิดเห็น (Feedback System):**
  * ให้ผู้เล่นส่งคะแนนความพึงพอใจและข้อเสนอแนะ พร้อมติดตามสถานะการตอบกลับจากผู้ดูแลระบบ

### 2. ระบบส่วนประมวลผลและหลังบ้าน (Backend & Database Functions)
* **Calculation & Rule Validation Engine:** ตรวจสอบความถูกต้องของข้อมูลตามกฎกติกาก่อนบันทึก
* **Relational Database (MySQL):** โครงสร้าง 16 ตาราง ออกแบบตามหลัก Normalization รองรับความสัมพันธ์แบบ One-to-Many และ Many-to-Many
* **ระบบผู้ดูแลระบบ (Admin Operations):**
  * **Admin Dashboard:** สรุปสถิติผู้ใช้งาน สถานะบัญชี และสัดส่วนสายอาชีพยอดนิยม
  * **User Management:** จัดการรายชื่อสมาชิก ตรวจสอบสถานะ ระงับ (Suspend) หรือแบนบัญชีผู้ใช้
  * **Master Data Management:** ระบบ CRUD เพิ่ม ลบ แก้ไขข้อมูลกฎกติกา เวทมนตร์ และไอเทมในคลังข้อมูลกลาง
  * **Feedback Inbox:** กล่องจดหมายอ่านข้อเสนอแนะและพิมพ์ตอบกลับผู้ใช้งาน

---

##  เทคโนโลยีที่ใช้ในการพัฒนา (Tech Stack)

| ส่วนของระบบ | เทคโนโลยี / เครื่องมือ | รายละเอียด |
| :--- | :--- | :--- |
| **Frontend** | React 18 / 19 | ไลบรารีสำหรับสร้าง User Interface แบบ Single Page Application |
| | Vite 7.x | โมเดิร์นบิลด์ทูลสำหรับการประมวลผลที่รวดเร็วสูง |
| | Tailwind CSS 4.x | ยูทิลิตี้เฟรมเวิร์กสำหรับจัดรูปแบบหน้าจอและธีม Dark Fantasy |
| | Three.js & Cannon.js | เอนจิน 3D และระบบฟิสิกส์สำหรับลูกเต๋า (`@3d-dice/dice-box`) |
| | React Router DOM v7 | ระบบจัดการเส้นทางหน้าจอ (Routing) |
| | SweetAlert2 | โมดอลแจ้งเตือนและกล่องยืนยันการทำรายการ |
| **Backend** | Node.js | สภาพแวดล้อมรันไทม์ฝั่งเซิร์ฟเวอร์ |
| | Express.js | เว็บเฟรมเวิร์กสำหรับสร้าง RESTful API |
| | MySQL2 (`promise`) | ไดรเวอร์เชื่อมต่อและคิวรีฐานข้อมูลแบบอะซิงโครนัส |
| | Bcrypt.js | การเข้ารหัสแฮชรหัสผ่านเพื่อความปลอดภัย |
| | Multer | ระบบจัดการอัปโหลดไฟล์ภาพ Avatar |
| | Nodemailer | ระบบส่งอีเมลแจ้งเตือนและรีเซ็ตรหัสผ่าน |
| | Google Generative AI | `@google/generative-ai` SDK เชื่อมต่อ Gemini 3.5 Flash สำหรับ AI DM |
| **Database** | MySQL 8.x / MariaDB | ระบบจัดการฐานข้อมูลเชิงสัมพันธ์ (จัดเก็บ 16 ตารางหลัก) |

---

##  สิ่งที่ต้องติดตั้งล่วงหน้า (Prerequisites)

ก่อนเริ่มการติดตั้ง กรุณาตรวจสอบและติดตั้งโปรแกรมเหล่านี้บนเครื่องคอมพิวเตอร์ของคุณ:

1. **[Node.js](https://nodejs.org/)** (แนะนำเวอร์ชัน **v18.x** หรือ **v20.x ขึ้นไป**)  
   *ตรวจสอบโดยเปิด Terminal / PowerShell แล้วพิมพ์:*
   ```bash
   node -v
   npm -v
   ```
2. **โปรแกรมจัดการฐานข้อมูล MySQL:**
   * แนะนำให้ติดตั้ง **[XAMPP](https://www.apachefriends.org/)** (ง่ายที่สุดสำหรับ Windows) หรือใช้ MySQL Server / MariaDB / Laragon
3. **โปรแกรมเว็บเบราว์เซอร์:** Google Chrome, Microsoft Edge หรือ Firefox (รองรับ WebGL และฮาร์ดแวร์เร่งความเร็วสำหรับลูกเต๋า 3 มิติ)
4. **Google Gemini API Key (ฟรี):**
   * เข้าไปขอ API Key ได้ที่ [Google AI Studio](https://aistudio.google.com/) (จำเป็นสำหรับฟีเจอร์ AI DM)
5. **บัญชี Gmail สำหรับส่งอีเมล (ทางเลือก):**
   * หากต้องการทดสอบระบบรีเซ็ตรหัสผ่าน ให้เปิดใช้งาน **2-Step Verification** บนบัญชี Google แล้วสร้าง **App Password (รหัสผ่านสำหรับแอป 16 หลัก)**

---

##  ขั้นตอนการติดตั้งอย่างละเอียดทีละขั้นตอน (Step-by-Step Installation)

### ขั้นตอนที่ 1: การนำเข้าฐานข้อมูล MySQL (Database Setup)

1. เปิดโปรแกรม **XAMPP Control Panel**
2. กดปุ่ม **Start** ที่โมดูล **Apache** และ **MySQL** ให้ขึ้นเป็นสีเขียว
3. เปิดเว็บเบราว์เซอร์แล้วเข้าไปที่: **`http://localhost/phpmyadmin`**
4. **สร้างฐานข้อมูลใหม่:**
   * คลิกที่เมนู **New (สร้างใหม่)** ที่แถบด้านซ้าย
   * ตั้งชื่อฐานข้อมูลว่า: **`dnd_project`**
   * เลือก Collation เป็น: **`utf8mb4_general_ci`** หรือ **`utf8mb4_unicode_ci`**
   * กดปุ่ม **Create (สร้าง)**
5. **นำเข้าไฟล์ SQL (Import):**
   * คลิกเลือกฐานข้อมูล `dnd_project` ที่เพิ่งสร้าง
   * คลิกที่แท็บ **Import (นำเข้า)** ที่เมนูด้านบน
   * ในส่วน *File to import* กดปุ่ม **Choose File (เลือกไฟล์)** แล้วเลือกไฟล์:
     ```text
     dnd-companion/dnd_project.sql
     ```
   * เลื่อนลงมาด้านล่างสุด แล้วกดปุ่ม **Import (นำเข้า / Go)**
   * รอระบบประมวลผลจนขึ้นข้อความสำเร็จสีเขียว (จะได้รับตารางข้อมูลทั้งหมด 16 ตาราง เช่น `users`, `characters`, `classes`, `spells`, `items`, `feedbacks` ฯลฯ)

>  **ทางเลือกสำหรับผู้ที่ใช้ MySQL Command-Line:**
> ```bash
> mysql -u root -p -e "CREATE DATABASE dnd_project CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
> mysql -u root -p dnd_project < dnd-companion/dnd_project.sql
> ```

---

### ขั้นตอนที่ 2: การติดตั้งและรันระบบเซิร์ฟเวอร์หลังบ้าน (Backend Setup)

1. เปิด Terminal หรือ PowerShell แล้วเข้าไปที่โฟลเดอร์ `Backend`:
   ```bash
   cd dnd-companion/Backend
   ```
2. ติดตั้งแพ็กเกจ Dependencies:
   ```bash
   npm install
   ```
3. สร้างและตั้งค่าไฟล์สภาพแวดล้อม **`.env`** ภายในโฟลเดอร์ `Backend/`:
   ```bash
   # หากมีไฟล์ .env อยู่แล้ว สามารถเปิดแก้ไขได้ทันที
   # หรือสร้างไฟล์ใหม่ชื่อ .env แล้วใส่ค่าตามนี้:
   ```
   *เนื้อหาในไฟล์ `Backend/.env`:*
   ```env
   # พอร์ตสำหรับรัน Backend API (ค่ามาตรฐาน: 5000)
   PORT=5000

   # คีย์สำหรับใช้งาน AI DM จาก Google AI Studio
   GEMINI_API_KEY=your_gemini_api_key_here

   # การตั้งค่าส่งอีเมลรีเซ็ตรหัสผ่าน (Gmail SMTP)
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16_digit_app_password
   ```
4. ตรวจสอบการเชื่อมต่อฐานข้อมูลใน `Backend/db.js`:
   * โดยค่าเริ่มต้น ระบบจะเชื่อมต่อไปที่ MySQL เครื่องตนเอง (Host: `localhost`, User: `root`, Password: ไม่มีรหัสผ่าน, Database: `dnd_project`)
   * *หาก MySQL ในเครื่องของคุณมีรหัสผ่าน ให้เปิดไฟล์ `Backend/db.js` และใส่รหัสผ่านในช่อง `password` ให้ตรงกัน*
5. รันเซิร์ฟเวอร์ Backend:
   ```bash
   node server.js
   ```
   เมื่อเซิร์ฟเวอร์ทำงานสำเร็จ จะปรากฏข้อความบนหน้าจอ:
   ```text
   Server running on port 5000
   ```
   *(กรุณาเปิดหน้าต่าง Terminal นี้ทิ้งไว้เพื่อให้บริการ API ตลอดการใช้งาน)*

---

### ขั้นตอนที่ 3: การติดตั้งและรันส่วนติดต่อผู้ใช้ (Frontend Setup)

1. เปิด Terminal หรือ PowerShell หน้าต่างใหม่ (เปิดแยกจาก Backend)
2. เข้าไปที่โฟลเดอร์ส่วนติดต่อผู้ใช้ `dungeon-companion`:
   ```bash
   cd dnd-companion/dungeon-companion
   ```
3. ติดตั้งแพ็กเกจ Dependencies:
   ```bash
   npm install
   ```
   >  **หมายเหตุสำคัญเรื่องระบบลูกเต๋า 3D:**  
   > ในระหว่างขั้นตอน `npm install` ระบบจะเรียกคำสั่ง `postinstall` อัตโนมัติ เพื่อรันสคริปต์ `node scripts/patch-dice-box.cjs` ซึ่งทำหน้าที่ปรับแต่งวิถีแรงหมุนของเอนจินลูกเต๋า 3D ให้ตกสู่มุมล่างขวาของหน้าจออย่างสวยงาม หากขึ้นข้อความ `[patch-dice-box] ... patched successfully` แสดงว่าระบบลูกเต๋าพร้อมทำงาน 100%

4. เริ่มต้นรันเซิร์ฟเวอร์ Vite Development:
   ```bash
   npm run dev
   ```
   เมื่อรันสำเร็จ หน้าจอจะแสดงลิงก์สำหรับเข้าใช้งาน:
   ```text
     VITE v7.x.x  ready in xxx ms

     ➜  Local:   http://localhost:5173/
     ➜  Network: use --host to expose
   ```

5. เปิดเว็บเบราว์เซอร์ไปที่: **`http://localhost:5173`** เพื่อเริ่มใช้งานระบบ

---

##  ข้อมูลบัญชีผู้ใช้เริ่มต้นสำหรับทดสอบระบบ (Default Credentials)

ในฐานข้อมูล `dnd_project.sql` มีการเตรียมบัญชีตัวอย่างไว้สำหรับทดสอบฟังก์ชันต่างๆ:

### 1. บัญชีผู้ดูแลระบบ (Administrator Account)
* **URL หน้าล็อกอินแอดมิน:** `http://localhost:5173/admin-login`
* **อีเมล (Email):** `admin@admin.com`
* **รหัสผ่าน (Password):** `admin123` หรือ `admin`
* **ความสามารถที่เข้าถึงได้:** หน้าแดชบอร์ดสถิติ (`/admin`), จัดการบัญชีสมาชิก, ปรับปรุงคลังข้อมูลหลัก (Master Data), และตอบกลับกล่องข้อความฟีดแบ็ก

### 2. บัญชีผู้เล่นทั่วไป (Normal User Account)
* **URL หน้าล็อกอินทั่วไป:** `http://localhost:5173/login`
* **สมัครบัญชีใหม่:** สามารถคลิกแท็บ **"สมัครสมาชิก (Register)"** บนหน้าเว็บเพื่อสร้างบัญชีใหม่ได้ทันทีโดยไม่ต้องผ่านแอดมิน
* **บัญชีตัวอย่างที่มีข้อมูลตัวละครแล้ว:**
  * **Email:** `testdm@gmail.com`
  * หรือสมัครสมาชิกใหม่เพื่อทดลองสร้างตัวละคร Barbarian, Wizard, Rogue ด้วยตนเองผ่านระบบ 7 สเต็ป

---

##  โครงสร้างไฟล์และโฟลเดอร์ของโครงงาน (Project Directory Structure)

```text
dnd-companion/
├── Backend/                         # เซิร์ฟเวอร์ API (Node.js & Express)
│   ├── routes/                      # เอนด์พอยต์และคอนโทรลเลอร์แยกตามโมดูล
│   │   ├── admin.js                 # ระบบจัดการผู้ใช้และสถิติภาพรวมของแอดมิน
│   │   ├── auth.js                  # ระบบลงทะเบียน ล็อกอิน และตรวจสอบสถานะบัญชี
│   │   ├── cc_data.js               # ระบบคลังข้อมูลและสืบค้น SRD 5e
│   │   ├── character.js             # ระบบ CRUD แผ่นตัวละครและการคำนวณสเตตัส
│   │   ├── dmRoutes.js              # ระบบเชื่อมต่อ Gemini API สำหรับ AI Dungeon Master
│   │   ├── feedback.js              # ระบบส่งและตอบกลับข้อเสนอแนะผู้ใช้งาน
│   │   ├── logs.js                  # ระบบบันทึกประวัติการทอยเต๋าและการเล่น
│   │   └── upload.js                # ระบบจัดการอัปโหลดภาพโปรไฟล์ผู้ใช้
│   ├── uploads/                     # โฟลเดอร์จัดเก็บภาพ Avatar ที่อัปโหลด
│   ├── db.js                        # โมดูลเชื่อมต่อ MySQL Connection Pool
│   ├── server.js                    # จุดเริ่มต้นเซิร์ฟเวอร์หลักและมิดเดิลแวร์
│   ├── package.json                 # รายการไลบรารีของ Backend
│   └── .env                         # ตัวแปรสภาพแวดล้อม (API Key, Port, SMTP)
│
├── dungeon-companion/               # ส่วนติดต่อผู้ใช้งานฝั่งหน้าบ้าน (React + Vite)
│   ├── public/                      # ไฟล์ Static และไอคอนของระบบ
│   ├── scripts/                     # สคริปต์ช่วยปรับแต่งระบบ
│   │   └── patch-dice-box.cjs       # สคริปต์แพตช์เอนจินลูกเต๋า 3D Physics
│   ├── src/                         
│   │   ├── assets/                  # ภาพประกอบ โลโก้ และกราฟิกแฟนตาซี
│   │   ├── components/              # คอมโพเนนต์ React ส่วนกลาง
│   │   │   ├── dice3d/              # เอนจิน Canvas เรนเดอร์ลูกเต๋า 3 มิติ
│   │   │   ├── Navbar.jsx           # แถบเมนูนำทางหลักของผู้เล่น
│   │   │   ├── AdminNavbar.jsx      # แถบเมนูนำทางของผู้ดูแลระบบ
│   │   │   └── Footer.jsx           # แถบส่วนท้ายเว็บไซต์
│   │   ├── pages/                   # หน้าจอหลักของระบบทั้งหมด
│   │   │   ├── Home.jsx             # หน้าแรกและแนะนำระบบ
│   │   │   ├── Workshop.jsx         # ผู้ช่วยสร้างตัวละคร 7 ขั้นตอน (Wizard)
│   │   │   ├── Sheets.jsx           # คลังตัวละครของผู้เล่น (Character Vault)
│   │   │   ├── CharacterSheetPage.jsx # แผ่นตัวละครพลวัตสำหรับเล่นสด (Dynamic Sheet)
│   │   │   ├── CompendiumHub.jsx    # ศูนย์รวมสารสนเทศกฎมาตรฐาน
│   │   │   ├── Compendium.jsx       # หน้าสืบค้นและคัดกรองเวทมนตร์/ไอเทม/มอนสเตอร์
│   │   │   ├── ClassTest.jsx        # ระบบแบบทดสอบบุคลิกภาพแนะนำอาชีพ
│   │   │   ├── ClassTestDM.jsx      # ระบบสนทนากับ AI Dungeon Master
│   │   │   ├── AdminDashboard.jsx   # แดชบอร์ดและระบบจัดการหลังบ้าน
│   │   │   ├── AdminLogin.jsx       # ประตูเข้าสู่ระบบสำหรับผู้ดูแลระบบ
│   │   │   ├── Login.jsx            # หน้าเข้าสู่ระบบและสมัครสมาชิก
│   │   │   └── Feedback.jsx         # แบบฟอร์มส่งข้อเสนอแนะและประเมินระบบ
│   │   ├── context/                 # State Management ระดับแอปพลิเคชัน
│   │   ├── utils/                   # ฟังก์ชันช่วยคำนวณสูตรคณิตศาสตร์และกติกา
│   │   ├── App.jsx                  # ระบบกำหนดเส้นทาง (React Router v7)
│   │   └── main.jsx                 # จุด Mount คอมโพเนนต์หลักของ React
│   ├── vite.config.js               # การตั้งค่า Vite และ Tailwind CSS
│   └── package.json                 # รายการไลบรารีของ Frontend
│
├── dnd_project.sql                  # สคริปต์สร้างฐานข้อมูลและข้อมูลตั้งต้น SRD
└── README.md                        # เอกสารคู่มือแนะนำและติดตั้งระบบฉบับนี้
```

---

##  แนวทางการแก้ไขปัญหาที่พบบ่อย (Troubleshooting)

| ปัญหาที่พบ | สาเหตุ | วิธีแก้ไข |
| :--- | :--- | :--- |
| **`ECONNREFUSED 127.0.0.1:3306`** | ไม่สามารถเชื่อมต่อกับฐานข้อมูล MySQL ได้ | ตรวจสอบว่าได้กด Start โมดูล **MySQL** ในโปรแกรม XAMPP หรือยัง และตรวจสอบว่าพอร์ต 3306 ใช้งานได้ปกติ |
| **`Access denied for user 'root'@'localhost'`** | รหัสผ่านฐานข้อมูลไม่ถูกต้อง | หาก MySQL ในเครื่องของคุณมีรหัสผ่าน ให้เปิดไฟล์ `Backend/db.js` แล้วใส่รหัสผ่านลงในบรรทัด `password: 'รหัสผ่านของคุณ'` |
| **`Server running on port 5000` ไม่ขึ้น / Error Port in use** | พอร์ต 5000 ถูกโปรแกรมอื่นใช้งานอยู่ | เปิดไฟล์ `Backend/.env` และเปลี่ยนเป็นพอร์ตอื่น เช่น `PORT=5001` จากนั้นตรวจสอบการเรียก fetch ใน Frontend |
| **ลูกเต๋า 3D ไม่หมุน หรือหน้าจอทอยเต๋าไม่ขึ้น** | เบราว์เซอร์ไม่ได้เปิดใช้ฮาร์ดแวร์เร่งความเร็ว WebGL | ไปที่การตั้งค่าของ Chrome/Edge $\rightarrow$ พิมพ์ค้นหา `Graphics acceleration` $\rightarrow$ ติ๊กเปิดใช้งาน **Use graphics acceleration when available** แล้วเปิดเบราว์เซอร์ใหม่ |
| **AI DM ไม่ตอบกลับ / ขึ้นข้อความ Error** | ไม่ได้ใส่คีย์ Gemini API หรือคีย์หมดอายุ | ไปที่ [Google AI Studio](https://aistudio.google.com/) สร้าง API Key ใหม่ แล้วนำมาวางในบรรทัด `GEMINI_API_KEY=` ในไฟล์ `Backend/.env` จากนั้นรีสตาร์ตเซิร์ฟเวอร์ Backend |
| **ส่งอีเมลรีเซ็ตรหัสผ่านไม่ไป** | ไม่ได้เปิดใช้งาน App Password ของ Google | ไปที่ Google Account Security เปิด 2-Step Verification และสร้าง **App Password** 16 หลัก นำมาใส่ในช่อง `SMTP_PASS=` ในไฟล์ `Backend/.env` |

---

##  การบิลด์ระบบสำหรับสภาพแวดล้อมจริง (Production Build)

หากต้องการนำระบบขึ้นโฮสติ้งจริงเพื่อใช้งานแบบ Production:

```bash
# 1. เข้าสู่โฟลเดอร์ Frontend
cd dungeon-companion

# 2. บิลด์ไฟล์ Assets ที่บีบอัดและปรับแต่งอย่างเหมาะสม
npm run build

# 3. ทดสอบพรีวิวผลการบิลด์ก่อนขึ้นเซิร์ฟเวอร์จริง
npm run preview
```
ไฟล์สำหรับขึ้นเว็บไซต์จริงจะถูกสร้างขึ้นที่โฟลเดอร์ `dungeon-companion/dist/`

---

##  ข้อกำหนดสิทธิ์และข้อจำกัดความรับผิดชอบ (Legal Notice & License)

โครงงานนี้เป็นผลงานเพื่อการศึกษา (Educational Purpose) ภายใต้นโยบาย **Fan Content Policy** ของบริษัท **Wizards of the Coast**:
* ไม่ได้รับการอนุมัติ สนับสนุน หรือมีส่วนเกี่ยวข้องอย่างเป็นทางการจาก Wizards of the Coast LLC
* ทรัพย์สินทางปัญญาและเครื่องหมายการค้า *Dungeons & Dragons* และ *D&D* เป็นลิขสิทธิ์ของ Wizards of the Coast LLC
* ข้อมูลกฎกติกา มอนสเตอร์ เวทมนตร์ และไอเทมที่ใช้ในระบบ อ้างอิงจากเอกสาร **System Reference Document 5.1 (SRD 5.1)** ซึ่งอยู่ภายใต้สัญญาอนุญาตสิทธิ์แบบเปิด **Creative Commons Attribution 4.0 International License (CC-BY-4.0)**
