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

## 1–3. อาคาร: ใช้วิธี "วาดทับภาพบล็อก"

ลองครั้งแรกแล้ว (9 ต.ค. 2569) ถ้าสั่งด้วยตัวเลขอย่างเดียว ChatGPT จะวาดตึกสวยแต่ผิดผัง เช่น เพิ่มตึกที่สอง หลังคาสูงเกิน หรือหน้าต่างเล็กและอยู่ผิดที่ ทำให้ไฟห้องในเกมไม่ตรงกับหน้าต่าง

**อัปเดต 9 ต.ค. 2569: T0 เสร็จแล้ว** ChatGPT ไม่ได้วางตามภาพบล็อกเป๊ะ แต่ได้โครงสร้างถูก (ตึกเดียว ชั้นละ 4 หน้าต่าง ล็อบบี้ บันไดขวา) Claude จึง**วัดตำแหน่งหน้าต่างและพื้นจากภาพจริง แล้วปรับเกมให้ตรงกับภาพ**แทน สำหรับ T1/T2 จึงขอแค่โครงสร้างถูก: ตึกเดียว 4 ชั้น ชั้นละ 4 หน้าต่างขนาดเท่ากัน มีเคาน์เตอร์ ประตู บันไดขวา (T2 เพิ่มห้องอาหาร) ไม่ต้องตรงทุกจุด และให้แนบภาพ T0 (`assets/sprites/building-t0.png`) ไปด้วยเสมอ ตึกจะได้ดูเป็นหลังเดียวกัน

วิธีที่ได้ผลกว่าคือแนบ **ภาพบล็อก** ขนาด 1024×1024 ซึ่งวางทุกอย่างไว้ตรงตำแหน่งในเกมแล้ว จากนั้นสั่งให้ ChatGPT "แต่งภาพนี้ให้เป็นภาพพิกเซลสวยๆ โดยไม่ขยับอะไร"

| ภาพ | แนบไฟล์ | ชื่อไฟล์ในเกม |
|---|---|---|
| T1 โรงแรม 16 ห้อง | `assets/art-templates/blockout-t1.png` + ภาพ T0 ที่ได้ | `building-t1.png` |
| T2 โรงแรม + ห้องอาหาร | `assets/art-templates/blockout-t2.png` + ภาพ T1 ที่ได้ | `building-t2.png` |

(สร้างภาพบล็อกใหม่ได้ด้วย `python3 tools/blockout.py assets/art-templates`)

### T0 (แนบ blockout-t0.png)

```text
The attached image is a BLOCKOUT of my game's hostel building (side-view facade). Repaint it as detailed pixel art in the style rules above.
STRICT: keep the exact same composition. Every shape must stay in the same position and the same size:
- the roof outline, the facade wall edges, the 8 windows (2 rows x 4), the brown floor beams, the HOSTEL sign, the reception desk, the potted plant, the door, the small staircase marks on the right edge, the grass line at the bottom.
- Do NOT add any other building, tower, emblem, tree in front of the facade, or extra floor. Do NOT move, resize, add or remove windows.
- Windows: keep the teak frame and the middle bar, glass stays flat window-grey #9db3b8 with nothing inside (the game lights them).
- Keep the floor area just above each brown beam and the lobby floor clear: staff characters walk there.
You may add: wood grain on beams, roof tiles and a Thai-style roof trim inside the roof shape, plaster texture with 2 shades, window sills, a lamp above the door, details on the desk and plant, a few tiles on the ground. Sky stays plain #bfe0ea (a couple of small pixel clouds above the roof is fine).
Output: square 1024x1024, same framing as the blockout.
```

### T1 (แนบ blockout-t1.png และภาพ T0 ที่ได้)

```text
Image 1 is the BLOCKOUT for the same hostel after it grew into a 5-storey hotel. Image 2 is the finished T0 art.
Repaint image 1 as pixel art in exactly the same style, colours and materials as image 2, so it is clearly the same building made taller.
STRICT: keep every shape of the blockout in the same position and size: roof outline, wall edges, 16 windows (4 rows x 4), floor beams, HOTEL sign, desk, door, staircase marks, grass line. No extra buildings or objects, no moved or resized windows, glass flat #9db3b8 with nothing inside, floors clear for walking staff.
Output: square 1024x1024, same framing as the blockout.
```

### T2 (แนบ blockout-t2.png และภาพ T1 ที่ได้)

```text
Image 1 is the BLOCKOUT for the same hotel with a small restaurant in the lobby. Image 2 is the finished T1 art.
Repaint image 1 so that everything above the lobby is identical to image 2, and the lobby follows the blockout: HOTEL sign and desk on the left, the door in the middle, the brick-red FOOD sign and two small teak tables with chairs on the right.
STRICT: same positions and sizes as the blockout, nothing added, floor clear between the tables for waiters.
Output: square 1024x1024, same framing as the blockout.
```

### ถ้าภาพออกมายังผิดผัง

พิมพ์ต่อในแชตเดิม:

```text
This does not match the blockout. Put the blockout back as the base and only change surface details: same outline, same window positions and sizes, no extra building. Try again.
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
