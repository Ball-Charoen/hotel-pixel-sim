Hotel Pixel Simulation: ชุดเทมเพลตงานภาพ (สำหรับ v0.3)

ไฟล์ในชุดนี้
- hotel-pixel-32.gpl / .hex : พาเลต 32 สีที่ใช้ในเกมตอนนี้ (นำเข้าได้ใน Aseprite, LibreSprite, Pixelorama, Lospec)
- palette-preview.png : ภาพตัวอย่างพาเลต
- guide-*.png : ภาพแนะนำเลย์เอาต์ (ขยายให้ดูง่าย ไม่ใช่ขนาดจริง)
- canvas-*.png : ผืนผ้าใบโปร่งใสขนาดจริง เปิดในโปรแกรมแล้ววาดได้เลย

ขนาดตามสเปก
- ตัวละครพนักงาน: 32x32 px ต่อเฟรม, 4 เฟรม (ยืน, เดิน 1, เดิน 2, ให้บริการ) x 8 คน = แผ่นเดียว 128x256 px
  เท้าวางที่แถวพิกเซลล่างสุด (เส้นแดงในไกด์) ตัวละครหันขวา
- ภาพหน้าตรง: 48x48 px x 8 คน = แผ่นเดียว 384x48 px
- อาคาร: 320x300 px ภาพตัดขวาง สัดส่วนเดียวกับตึกในเกม (8 ห้อง 2 ชั้น + ล็อบบี้)
- ภาพเมือง: 160x96 px วางสถานที่เด่นในกรอบประ

ตั้งค่าตอนส่งออก
- PNG ขนาดจริง (scale 100%) ไม่เปิด anti-aliasing / smoothing
- พื้นหลังโปร่งใส (ยกเว้นภาพเมือง)
- ใช้เฉพาะสีในพาเลต ถ้ามีสีเกิน ให้ใช้คำสั่งลดสีหรือ map to palette ของโปรแกรม

ตั้งชื่อไฟล์
- staff-sprites.png, staff-portraits.png
- building-t0.png ... building-t4.png, style-city.png, style-resort.png ...
- city-bkk.png, city-kkn.png, city-hkt.png, city-pty.png, city-pbi.png, city-rbr.png, city-rng.png, city-cnx.png, city-pnb.png
