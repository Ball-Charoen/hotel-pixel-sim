# คู่มือสมัครบัญชีสำหรับ P2 (GitHub + Supabase)

คู่มือนี้ให้คุณ (เจ้าของโปรเจกต์) ทำเองทีละขั้น Claude สมัครบัญชีแทนหรือล็อกอินแทนไม่ได้ เพราะต้องใช้อีเมลและรหัสผ่านของคุณ
ใช้เวลาประมาณ 20–30 นาที ทำส่วน A และ B สลับลำดับกันได้

ส่วนนี้ **ไม่มีค่าใช้จ่าย** และไม่ต้องใส่บัตรเครดิต ถ้าหน้าไหนขอบัตรเครดิต ให้หยุดแล้วบอก Claude ก่อน

---

## สิ่งที่ต้องส่งให้ Claude เมื่อทำเสร็จ

| ส่งได้ | ห้ามส่งให้ใคร (รวมถึง Claude) |
|---|---|
| ชื่อผู้ใช้ GitHub และลิงก์ repo | รหัสผ่าน GitHub / Supabase |
| Project URL ของ Supabase (`https://xxxx.supabase.co`) | Database password |
| Publishable key (ขึ้นต้นด้วย `sb_publishable_`) | Secret key (ขึ้นต้นด้วย `sb_secret_`) หรือ `service_role` |
| อีเมลบัญชีอาจารย์ที่สร้าง (ไม่ต้องส่งรหัสผ่าน) | รหัสยืนยันตัวตน 2 ขั้น (2FA) |

ทำไม publishable key ส่งได้: Supabase ออกแบบให้ใส่ในหน้าเว็บได้ ข้อมูลจะเข้าถึงได้เท่าที่กฎความปลอดภัย (RLS) อนุญาต
ส่วน secret key ข้ามกฎทั้งหมด ([Supabase: API keys](https://supabase.com/docs/guides/api/api-keys))

แนะนำให้เก็บรหัสผ่านทุกอย่างไว้ในโปรแกรมจัดการรหัสผ่าน (เช่น iCloud Keychain, 1Password, Bitwarden)

---

## ส่วน A: GitHub (เก็บโค้ดและเปิดหน้าเว็บเกม)

1. เปิด https://github.com/signup
2. ใส่อีเมล ตั้งรหัสผ่าน และตั้ง **ชื่อผู้ใช้** (username) ชื่อนี้จะอยู่ในลิงก์เกม เช่น `https://ชื่อผู้ใช้.github.io/hotel-pixel-sim/`
   ควรเลือกชื่อสุภาพ ใช้ในห้องเรียนได้
3. ยืนยันอีเมลตามที่ GitHub ส่งมา
4. ถ้า GitHub ขอให้ตั้ง **ยืนยันตัวตน 2 ขั้น (2FA)** ให้ทำตาม (ใช้แอป Authenticator บนมือถือ) และเก็บ recovery codes ไว้ที่ปลอดภัย
5. เลือกแพ็กเกจ **Free** (ไม่ต้องจ่าย)
6. สร้าง repo เปล่า:
   - กดปุ่ม **+** มุมขวาบน → **New repository**
   - Repository name: `hotel-pixel-sim`
   - เลือก **Public** (ตามที่ตกลงไว้: GitHub Pages ฟรีใช้ได้กับ repo สาธารณะ [GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages))
   - **ไม่ต้องติ๊ก** Add a README / .gitignore / license (ปล่อยว่าง เพราะโค้ดมีอยู่แล้วในเครื่อง)
   - กด **Create repository**
7. คัดลอกลิงก์ repo (เช่น `https://github.com/ชื่อผู้ใช้/hotel-pixel-sim`) ไว้ส่งให้ Claude

การส่งโค้ดจากเครื่องขึ้น GitHub เป็นขั้นถัดไป Claude จะบอกวิธีล็อกอิน GitHub จากเทอร์มินัลให้คุณทำเองอีกครั้ง

---

## ส่วน B: Supabase (ฐานข้อมูล ระบบล็อกอิน และตัวคำนวณผลบนเซิร์ฟเวอร์)

### B1. สมัครและสร้างโปรเจกต์

1. เปิด https://supabase.com แล้วกด **Start your project**
2. สมัครด้วย **Continue with GitHub** (สะดวกที่สุด ใช้บัญชีจากส่วน A) หรือใช้อีเมลก็ได้
3. ถ้าระบบให้สร้าง Organization: ตั้งชื่ออะไรก็ได้ เช่น `Hotel Pixel Class` เลือกแพ็กเกจ **Free**
4. กด **New project** แล้วกรอก:
   - Project name: `hotel-pixel-sim`
   - Database password: กด **Generate a password** แล้ว **บันทึกเก็บไว้เอง** (ห้ามส่งให้ใคร)
   - Region: **Southeast Asia (Singapore)** (ใกล้ไทยที่สุด เกมตอบสนองเร็ว)
   - กด **Create new project** รอประมาณ 1–2 นาที

### B2. เปิดให้นักศึกษาเข้าเกมได้โดยไม่ต้องสมัคร

1. เมนูซ้าย **Authentication** → **Sign In / Providers** (ชื่อเมนูอาจต่างเล็กน้อยตามเวอร์ชัน)
2. หาตัวเลือก **Allow anonymous sign-ins** แล้วเปิด (สีเขียว) → กด **Save**
   ([Supabase: Anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous))

### B3. เพิ่มเพดานการเข้าเกม (สำคัญสำหรับห้องเรียน)

ค่าเริ่มต้นคือ **30 ครั้งต่อชั่วโมงต่อ IP** ถ้าทั้งห้องใช้ Wi-Fi มหาวิทยาลัย (IP เดียวกัน) นักศึกษาคนที่ 31 จะเข้าไม่ได้
([Supabase: Rate limits](https://supabase.com/docs/guides/auth/rate-limits))

1. เมนูซ้าย **Authentication** → **Rate Limits**
2. ช่อง **anonymous** (Rate limit for anonymous users / sign-ins) เปลี่ยนจาก 30 เป็น **150** ต่อชั่วโมง **[ข้อเสนอ]** (พอสำหรับห้องละประมาณ 40–60 คน และเผื่อคนเข้าใหม่)
3. กด **Save**

### B4. สร้างบัญชีอาจารย์ (ไม่ต้องรออีเมลยืนยัน)

ระบบอีเมลฟรีของ Supabase ส่งได้แค่ 2 ฉบับต่อชั่วโมง จึงสร้างบัญชีอาจารย์ด้วยมือแทน

1. เมนูซ้าย **Authentication** → **Users**
2. กด **Add user** → **Create new user**
3. ใส่อีเมลอาจารย์ (เช่นอีเมลมหาวิทยาลัยของคุณ) และตั้งรหัสผ่านใหม่ (ไม่ใช่รหัสเดียวกับ GitHub)
4. ติ๊ก **Auto Confirm User** แล้วกด **Create user**
5. ถ้ามีอาจารย์ท่านอื่น ทำซ้ำได้

ใครที่ไม่ได้อยู่ในรายชื่ออาจารย์จะสร้างห้องไม่ได้ Claude จะตั้งกฎนี้ในฐานข้อมูลในขั้นถัดไป

### B5. คัดลอกค่าที่ต้องส่งให้ Claude

1. เมนูซ้าย **Project Settings** (รูปเฟือง) → **API Keys**
   หรือกดปุ่ม **Connect** ด้านบนของหน้าโปรเจกต์
2. คัดลอก:
   - **Project URL** เช่น `https://abcdefgh.supabase.co`
   - **Publishable key** ที่ขึ้นต้นด้วย `sb_publishable_`
3. **อย่าคัดลอก** Secret key (`sb_secret_...`) หรือ `service_role`

---

## หลังทำเสร็จ

ส่งข้อความหา Claude ตามรูปแบบนี้ได้เลย:

```
GitHub: ชื่อผู้ใช้ = ...
Repo: https://github.com/.../hotel-pixel-sim
Supabase URL: https://....supabase.co
Publishable key: sb_publishable_...
อีเมลอาจารย์: ...
```

## เรื่องที่ควรรู้ระหว่างใช้งาน

- **Supabase แบบฟรีจะพักโปรเจกต์อัตโนมัติถ้าไม่มีใครใช้ 1 สัปดาห์** ([Supabase pricing](https://supabase.com/pricing))
  ก่อนสอนแต่ละครั้ง ให้เปิด https://supabase.com/dashboard แล้วกด **Restore / Resume project** ถ้าโปรเจกต์ถูกพักอยู่ (ใช้เวลาไม่กี่นาที)
- โควตาแบบฟรี: ฐานข้อมูล 500 MB, เชื่อมต่อพร้อมกันได้ 200 คน, คำนวณผลบนเซิร์ฟเวอร์ได้ 500,000 ครั้งต่อเดือน (เหลือเฟือสำหรับห้องเรียน)
- **ข้อมูลส่วนบุคคล (PDPA):** ชื่อนักศึกษาจะเก็บบนเซิร์ฟเวอร์ที่สิงคโปร์ แนะนำให้นักศึกษาใช้ **ชื่อเล่น** และลบห้องเมื่อจบรายวิชา
  ถ้าจะใช้ข้อมูลการเล่นทำวิจัย ต้องขอความยินยอมก่อน (เรื่องนี้ยังเปิดอยู่ใน docs/spec-summary.md §14)
