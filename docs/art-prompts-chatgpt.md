# Prompt สำหรับให้ ChatGPT สร้างภาพพิกเซลของเกม

ไฟล์นี้มี prompt สำเร็จรูปให้คัดลอกไปวางใน ChatGPT ส่วนที่ต้องคัดลอกคือข้อความในกล่องสีเทา (ภาษาอังกฤษ เพราะได้ผลแม่นกว่า)

## อ่านก่อน: ChatGPT ทำอะไรได้และไม่ได้

- ChatGPT สร้างภาพได้แค่ขนาดของมันเอง (1024×1024, 1536×1024 หรือ 1024×1536) **ทำขนาดเป๊ะๆ อย่าง 320×300 ไม่ได้** และมักใส่สีเกินชุดสีของเกม
- ดังนั้นขั้นตอนคือ:
  1. คุณใช้ prompt ด้านล่างให้ ChatGPT วาด "แบบภาพพิกเซลขยายใหญ่"
  2. ส่งภาพที่ได้มาให้ Claude
  3. Claude จะย่อให้ได้ขนาดจริง เปลี่ยนเป็นสีในชุดของเกม ลบพื้นหลัง และจัดตำแหน่งให้ตรงกับเกม
- ภาพอาคารต้องวางหน้าต่างตรงจุดที่เกมจะเปิดไฟ ChatGPT วางได้ใกล้เคียง แต่ไม่ตรงทุกจุด Claude จะเลื่อนหรือวาดกรอบหน้าต่างทับให้ตรงเอง
- ตัวละครเดินขนาด 32×32 เล็กมาก ChatGPT มักวาดแต่ละท่าไม่เหมือนกัน ถ้าทำแล้วไม่สวย ให้ Claude วาดเองด้วยโค้ดได้ ซึ่งคุมให้ทั้ง 8 คนเข้าชุดกันได้ง่ายกว่า

**วิธีใช้:**
1. เปิดแชตใหม่ใน ChatGPT
2. วาง **prompt หลัก (ข้อ 0)** ก่อน 1 ครั้ง
3. วาง prompt ของภาพที่ต้องการ แนบไฟล์ไกด์ที่ระบุไว้ (อยู่ใน `assets/art-templates/`)
4. ถ้าไม่ชอบ ให้พิมพ์สั่งแก้ทีละจุด เช่น "make the roof darker, keep everything else the same"
5. ดาวน์โหลดภาพเป็น PNG แล้วส่งให้ Claude พร้อมบอกว่าเป็นภาพอะไร

ค่าที่มีป้าย **[ข้อเสนอ]** คือสิ่งที่ Claude ออกแบบเอง (สไตล์ตึก สีชุดพนักงาน) เปลี่ยนได้ตามใจ

---

## 0. Prompt หลัก (วางครั้งแรกในทุกแชต)

```text
You are making pixel art for a 2D educational hotel-management game set in Thailand.
Follow these rules in every image I ask for in this chat:

STYLE
- Clean retro pixel art, like a 16-bit SNES/GBA management game. Side view, flat front-facing (orthographic), no perspective, no 3D, no isometric.
- Big, chunky, clearly visible square pixels. Draw it as if it were a tiny low-resolution image scaled up with nearest-neighbour: every "art pixel" must be a crisp square block of the same size.
- NO anti-aliasing, NO blur, NO gradients, NO soft shadows, NO glow, NO noise, NO dithering, NO photo textures, NO painterly brush strokes.
- Flat colour areas with 1-pixel dark outlines (#1d2b34) and at most 2 shading steps per material.
- No text, letters, logos, watermarks, signatures or UI unless I ask for specific text.

PALETTE: use ONLY these 32 colours, nothing else:
#1d2b34 ink, #3a3a44 charcoal, #7d8fa0 slate, #f4efe2 cream, #e9d9bf wall beige, #bfe0ea sky, #e8f0f2 mist, #9db3b8 window grey,
#f2b33d lamp yellow, #e8b730 gold, #7a4b32 roof brown, #8c5a3c teak, #5b3724 dark wood, #b5643c brick, #c0473a red, #c8577a pink,
#1f7a65 jade, #3e8e7e teal, #6ba55a leaf, #a8d58a light leaf, #3f7a4a forest, #6e8f5a grass, #3e8db5 sea blue, #4f6fb0 blue,
#f1c9a5 skin 1, #e0ac82 skin 2, #c68b5e skin 3, #9a6644 skin 4, #2b2222 hair black, #4a3426 hair brown, #1e2430 hair navy, #b6542f hair auburn.

Reply only with the image. If something in my request is impossible, tell me briefly instead of guessing.
```

---

## 1. อาคารโฮสเทลเริ่มต้น T0 → `building-t0.png` (ขนาดจริง 320×300)

แนบไฟล์: `assets/art-templates/guide-building-320x300-x2.png`

```text
Draw the hotel building for stage T0: a small 3-storey Thai hostel, shown as a side-view facade.
Image size: square 1024x1024. The design grid below is 320 wide x 300 tall, drawn at 3.2x so it fills 1024x960; put 64 px of plain sky #bfe0ea at the very top to fill the square. Final art will be scaled down to 320x300.
Use the attached guide image for the layout. Follow its boxes exactly, but do NOT draw the guide lines or labels.

Layout, measured on a 320 x 300 grid (x from left, y from top):
- Sky background #bfe0ea everywhere above the ground. Grass/pavement strip at the bottom: y 286 to 300.
- Roof: x 12-308, y 16-66. Stepped Thai-style roof in #7a4b32 with a teak #8c5a3c trim. [proposal]
- Facade wall: x 20-299, from y 66 down to the ground at y 286, wall beige #e9d9bf with teak #8c5a3c floor beams between storeys.
- Floor 2 (top guest floor): y 66-128. Four windows, each exactly 46 wide x 41 tall, at x = 41, 108, 174, 241, top edge y = 74.
- Floor 1: y 137-198. Four windows, same size, same x positions, top edge y = 145.
- Every window: a simple teak frame 2 px thick around plain flat window-grey #9db3b8 glass, one vertical mullion in the middle. Nothing inside the glass (no curtains, people or lights) - the game lights the windows itself.
- Lobby (ground floor): y 207-286. A flat sign box at the top-left (x 30-90, y 214-232), in jade #1f7a65, with the word HOSTEL in cream blocky pixel letters. A teak reception desk on the left (x 44-96, sitting on the floor at y 286, 18 px tall). A dark wood #5b3724 double door at x 228-258, 52 px tall, with a small lamp. A potted plant at about x 166-186.
- A narrow staircase column on the far right edge (x 286-300) running from the ground up to the top floor.
- Each storey has a clear, flat floor line at its bottom edge (y 128, 198 and 286): staff characters 32 px tall will walk on these lines, so keep the space just above each line free of furniture except the desk and plant.
- Style: warm, friendly Thai shophouse feeling, teak wood and beige plaster. [proposal]
```

## 2. โรงแรมประเภท 1 T1 → `building-t1.png` (16 ห้อง 4 ชั้น)

แนบไฟล์:
- `assets/art-templates/guide-building-t1-t2-320x300-x2.png`
- ภาพ T0 ที่ได้จากข้อ 1 (ให้ตึกต่อเติมแล้วยังดูเป็นตึกเดิม)

```text
Now draw the same building after it has been extended to a 5-storey Type-1 hotel (stage T1). Keep exactly the same style, colours, materials and roof design as the T0 image I attached, so it clearly looks like the same building grown taller.
Image size: square 1024x1024, same framing as the T0 image (320 x 300 design grid at 3.2x, plus 64 px of plain sky at the very top). Follow the attached guide (T1/T2) for the layout, without drawing its guide lines or labels.

Layout on a 320 x 300 grid:
- Sky #bfe0ea background, ground strip y 286-300.
- Roof: x 12-308, y 16-50 (lower and flatter than T0).
- Facade wall x 20-299 from y 50 to y 286, with teak floor beams between storeys.
- Four guest floors, each with four windows 46 wide x 30 tall at x = 41, 108, 174, 241:
  floor 4: band y 50-94, window top y 55
  floor 3: band y 98-142, window top y 103
  floor 2: band y 146-190, window top y 151
  floor 1: band y 194-238, window top y 199
- Windows: teak frame 2 px, flat #9db3b8 glass, one middle mullion, nothing inside.
- Lobby: y 242-286. Jade sign box at top-left (x 30-82, y 249-267) with the word HOTEL in cream blocky pixel letters. Teak reception desk on the left (x 44-96, 18 px tall, on the floor at y 286). Dark wood door at x 228-258, 38 px tall, plant at about x 166-186.
- Narrow staircase column on the far right edge (x 286-300) from the ground to the top floor.
- Clear flat floor lines at y 94, 142, 190, 238 and 286 for 32-px-tall staff to walk on.
```

## 3. โรงแรมประเภท 2 T2 (มีห้องอาหาร) → `building-t2.png`

แนบไฟล์: ภาพ T1 ที่ได้จากข้อ 2

```text
Take the T1 hotel image I attached and change ONLY the lobby (y 242-286 on the 320 x 300 grid). Everything above the lobby must stay pixel-for-pixel identical.
- Keep the HOTEL sign and the reception desk on the left.
- Move the entrance door to x 132-156 (dark wood, 38 px tall).
- Remove the plant and the old door on the right. In their place add a small Thai restaurant area from x 178 to 262: a brick-red #b5643c sign box (x 178-222, y 249-267) with the word FOOD in cream blocky letters, and two small teak tables with chairs on each side, standing on the floor line y 286, with tiny cream plates on the tables.
- Keep the floor line at y 286 clear between the tables, because waiters walk there.
Same size and framing as before (1024x1024).
```

---

## 4. ตัวละครพนักงานเดิน → `staff-sprites.png` (ขนาดจริง 128×256 = 8 คน × 4 ท่า ท่าละ 32×32)

ให้ ChatGPT วาด**ทีละคน** (1 ภาพต่อ 1 คน) จะได้ผลดีกว่าสั่งวาดทั้ง 8 คนในภาพเดียว จากนั้น Claude จะนำ 8 ภาพมาเรียงต่อกันเป็นแผ่นเดียว

ลำดับของคนต้องตรงกับในเกม: แถว 1–3 คือพนักงานต้อนรับ (front office), แถว 4–6 คือแม่บ้าน (housekeeping), แถว 7–8 คือพนักงานอาหารและเครื่องดื่ม (F&B) ส่วนชื่อพนักงานเกมสุ่มใหม่ทุกเกม จึงไม่ต้องให้หน้าตรงกับชื่อ

| แถว | ตำแหน่ง | ใส่ใน prompt ตรง `{CHARACTER}` [ข้อเสนอ] |
|---|---|---|
| 1 | Front office | young woman, skin #f1c9a5, black hair in a bun, jade #1f7a65 blazer over a cream shirt, dark trousers |
| 2 | Front office | young man, skin #e0ac82, short black hair, jade #1f7a65 blazer, cream shirt, dark trousers |
| 3 | Front office | woman in her 30s, skin #c68b5e, brown shoulder-length hair, jade #1f7a65 blazer, cream shirt, dark skirt |
| 4 | Housekeeping | woman, skin #e0ac82, black hair tied back, teal #3e8e7e tunic with a cream apron |
| 5 | Housekeeping | man, skin #9a6644, short black hair, teal #3e8e7e tunic, dark trousers |
| 6 | Housekeeping | older woman, skin #c68b5e, grey-streaked hair in a bun, teal #3e8e7e tunic with a cream apron |
| 7 | F&B | young man, skin #f1c9a5, short auburn #b6542f hair, cream shirt with a red #c0473a apron |
| 8 | F&B | young woman, skin #c68b5e, black ponytail, cream shirt with a red #c0473a apron |

```text
Draw a pixel-art sprite strip for ONE hotel staff character: {CHARACTER}.
- Square image 1024x1024 split into a 2 x 2 grid of equal cells (each 512x512), one pose per cell:
  top-left = IDLE standing, top-right = WALK frame 1 (left leg forward),
  bottom-left = WALK frame 2 (right leg forward), bottom-right = SERVE (arm stretched forward holding a small cream tray).
- The character is designed on a 32 x 32 pixel grid per cell (each art pixel = a 16x16 block), side view, facing RIGHT, full body, about 26 art-pixels tall, centred horizontally, feet touching the bottom edge of the cell.
- Exactly the same character, size, colours and position in all 4 cells; only the legs and arms change.
- Background: solid flat pure magenta #FF00FF in every cell (it will be removed). No shadow on the ground, no outline around the cell, no grid lines.
- Simple, readable chibi proportions: big head (about 9 art-pixels), 1-pixel dark #1d2b34 outline.
```

## 5. รูปหน้าพนักงาน → `staff-portraits.png` (ขนาดจริง 384×48 = 8 รูป รูปละ 48×48)

ทำทีละคนเช่นกัน ใช้คำบรรยายตัวละครแถวเดียวกับตารางข้อ 4 และควรแนบภาพตัวละครเดินของคนนั้นไปด้วย หน้าตาจะได้ตรงกัน

```text
Draw a pixel-art portrait of the same character as in the attached sprite strip: {CHARACTER}.
- Image 1024x1024, designed on a 48 x 48 pixel grid (each art pixel is a block about 21x21 px).
- Head and shoulders, facing the viewer, friendly neutral smile, uniform collar visible at the bottom.
- Background: solid flat pure magenta #FF00FF (it will be removed). No frame, no text.
- 1-pixel dark #1d2b34 outline, at most 2 shading steps per colour, only the game palette colours.
```

---

## หลังได้ภาพแล้ว

ส่งไฟล์ PNG ให้ Claude ในแชตนี้ พร้อมบอกว่าเป็นภาพไหน (เช่น "T0", "พนักงานแถว 3", "หน้าแถว 3") Claude จะทำต่อดังนี้:
1. ย่อภาพให้ได้ขนาดจริง
2. เปลี่ยนสีให้อยู่ในชุด 32 สี
3. ลบพื้นหลังชมพู (magenta)
4. จัดหน้าต่างและพื้นให้ตรงกับเกม
5. ส่งภาพตัวอย่างให้คุณดูก่อนใส่เกม
