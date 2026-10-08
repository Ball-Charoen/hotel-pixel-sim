/* ---------- customer tab ---------- */
const REV={pos:{serv:'พนักงานใส่ใจ ช่วยแนะนำที่เที่ยวดีมาก',value:'คุ้มค่ากับราคา ไว้จะกลับมาพักอีก',app:'พนักงานแต่งกายเรียบร้อย ล็อบบี้ดูดี',lang:'Staff speak good English, very helpful!',prof:'เช็กอินรวดเร็ว เป็นมืออาชีพ เหมาะกับการมาทำงาน',exp:'ห้องพร้อมตามที่จอง ไม่มีปัญหาเลย'},
 neg:{adequacy:'รอเช็กอินนานมาก พนักงานดูไม่พอ',price:'ราคาแพงเกินไปเมื่อเทียบกับบริการ',lang:'Hard to communicate, staff barely speak English.',serv:'พนักงานไม่ค่อยยิ้ม ดูไม่อยากบริการ',prof:'ไม่เหมาะกับการมาทำงาน ข้อมูลการจองผิดพลาด',exp:'ห้องไม่พร้อมตอนเช็กอิน ต้องรอทำความสะอาด'},neu:'โดยรวมโอเค สมราคา'};
function reviewsFor(r,week){const rng=mulberry32(week*977+13);const out=[];const avgP=r.adr||0;
  SEGMENTS.slice().sort((a,b)=>(r.seg[b.id]||0)-(r.seg[a.id]||0)).forEach(s=>{const sq=r.segQ[s.id];if(!sq||sq.n<1)return;const t=r.team;const fs=clamp(CITIES[G.city].foreign*s.fb,0,.95);let text,kind;
    if(sq.rating>=4){const c=[];if(t.serv>=70)c.push('serv');if(avgP<=s.wtp*.9)c.push('value');if(t.app>=70)c.push('app');if(t.lang>=70&&fs>.3)c.push('lang');if(t.prof>=70&&s.id==='biz')c.push('prof');if(t.exp>=70)c.push('exp');if(!c.length)c.push('value');text=REV.pos[c[Math.floor(rng()*c.length)]];kind='pos';}
    else if(sq.rating<=2.6){const c=[];if(r.adequacy<.8)c.push('adequacy');if(avgP>s.wtp*1.2)c.push('price');if(t.lang<45&&fs>.3)c.push('lang');if(t.serv<50)c.push('serv');if(t.prof<50&&s.id==='biz')c.push('prof');if(t.exp<50)c.push('exp');if(!c.length)c.push('price');text=REV.neg[c[Math.floor(rng()*c.length)]];kind='neg';}
    else{text=REV.neu;kind='neu';}
    out.push({seg:s,stars:Math.round(sq.rating),text,kind});});
  (r.crises||[]).filter(c=>c.id==='pr').forEach(c=>out.unshift({seg:null,stars:1,text:`โพสต์ไวรัล: ${c.detail}`,kind:'neg'}));
  return out.slice(0,5);}
function tabCustomer(){if(!LAST)return `<div class="panel"><h2>ข้อมูลลูกค้าจะแสดงหลังจบสัปดาห์แรก</h2><p>หน้านี้จะแสดงการรับรู้ ความคาดหวัง ความพึงพอใจ และรีวิวออนไลน์ (eWOM) ของลูกค้าแต่ละกลุ่ม</p></div>`;
  const o=LAST,y=o.hotels.you;const d=y.dist;const tot=d.reduce((a,b)=>a+b,0)||1;const pos=(d[3]+d[4])/tot,neu=d[2]/tot,neg=(d[0]+d[1])/tot;
  const rvs=reviewsFor(y,o.week);
  return `<div class="grid4">
  <div class="panel"><h2>การรับรู้ของลูกค้า</h2><p class="small">สัดส่วนลูกค้าแต่ละกลุ่มที่รู้จักโรงแรมคุณ (แถบสี) เทียบค่าเฉลี่ยคู่แข่ง (เส้นดำ) มาจากงบการตลาดสะสมและ OTA</p>
   ${SEGMENTS.map(s=>hbar(s.name,y.aw[s.id]*100,o.comp.aw[s.id]*100,100,Math.round(y.aw[s.id]*100)+'%')).join('')}</div>
  <div class="panel"><h2>ความคาดหวัง กับ สิ่งที่ได้รับ</h2><p class="small">แถบสี = คุณภาพบริการที่ส่งมอบให้แต่ละกลุ่ม เส้นดำ = ความคาดหวัง ช่องว่างระหว่างสองค่านี้คือแนวคิดหลักของ ${src('servqual','SERVQUAL')} ราคายิ่งสูง ความคาดหวังยิ่งสูง</p>
   ${SEGMENTS.map(s=>{const q=y.segQ[s.id];return hbar(`${s.name}<br><span class="small muted">${Math.round(q.n)} ห้อง-คืน</span>`,q.q,q.e,100,`${q.rating.toFixed(1)}★`);}).join('')}</div>
  <div class="panel"><h2>ความพึงพอใจและรีวิว</h2><p>รีวิวใหม่สัปดาห์นี้ <b>${y.newRev}</b> รีวิว · คะแนนเฉลี่ยสัปดาห์นี้ <b>${y.rating?y.rating.toFixed(2):'–'}</b> · ดาวสะสม <b>${y.R.toFixed(2)}</b> จาก ${fmt(y.N)} รีวิว</p>
   ${[5,4,3,2,1].map(k=>hbar('★'.repeat(k),d[k-1],null,Math.max(1,...d),d[k-1])).join('')}
   <div class="segbar" style="margin-top:10px"><span style="width:${pos*100}%;background:var(--jade)"></span><span style="width:${neu*100}%;background:var(--sh)"></span><span style="width:${neg*100}%;background:var(--chili)"></span></div>
   <div class="legend"><span style="--c:var(--jade)">บวก ${Math.round(pos*100)}%</span><span style="--c:var(--sh)">กลาง ${Math.round(neu*100)}%</span><span style="--c:var(--chili)">ลบ ${Math.round(neg*100)}%</span></div>
   <div class="chart" style="margin-top:8px">${lineChart([{name:'คะแนนรีวิวรายสัปดาห์',color:'var(--lamp)',values:LOG.map(r=>r.rating)},{name:'ดาวสะสม',color:'var(--jade)',values:LOG.map(r=>r.R)}],LOG.map(r=>'ส.'+r.week),{aria:'คะแนนรีวิว',min:0,h:160})}</div></div>
  <div class="panel"><h2>รีวิวออนไลน์ (eWOM)</h2><p class="small">eWOM คือการบอกต่อผ่านอินเทอร์เน็ต สำคัญมากในธุรกิจโรงแรมเพราะลูกค้าประเมินบริการก่อนเข้าพักไม่ได้ (${src('litvin','Litvin et al., 2008')}) ตัวอย่างรีวิวด้านล่างสร้างจากสาเหตุจริงในเกม</p>
   ${rvs.map(r=>`<div class="review"><span class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</span> <span class="small muted">${r.seg?r.seg.name:'โซเชียลมีเดีย'}</span><br>${esc(r.text)}</div>`).join('')||'<p class="muted small">ยังไม่มีรีวิว</p>'}
   ${y.fake?'<p class="warn">มีรีวิวปลอมปนอยู่ ดาวสะสมจึงสูงกว่าความพึงพอใจจริง</p>':''}</div></div>`;}
/* ---------- report tab ---------- */
function arrow(v,ref){if(!ref)return '';return v>=ref?'<span class="up">▲</span>':'<span class="down">▼</span>';}
function kpiCards(o){const y=o.hotels.you,c=o.comp,i=o.idx;const avail=8*7;
 return `<div class="kpis">
 <div class="kpi"><div class="name">Occupancy (อัตราเข้าพัก)</div><div class="num">${pct(y.occ)}</div><div class="vs">${arrow(y.occ,c.occ)} คู่แข่งเฉลี่ย ${pct(c.occ)} · วันธรรมดา ${pct(y.occP.wd)} / สุดสัปดาห์ ${pct(y.occP.we)}</div>
  <details><summary>อ่านค่านี้อย่างไร</summary><p><b>ความหมาย:</b> สัดส่วนห้อง-คืนที่ขายได้ จากห้อง-คืนทั้งหมดที่เปิดขาย</p><p><b>คำนวณสัปดาห์นี้:</b> <span class="calc">${y.sold} ÷ ${avail} × 100 = ${pct(y.occ)}</span></p>
  <p><b>ทำไมสำคัญ:</b> บอกว่าดีมานด์มาถึงโรงแรมคุณแค่ไหน และกำหนดภาระงานของพนักงานกับต้นทุนต่อห้อง</p><p><b>ข้อควรระวัง:</b> ไม่ได้คำนึงถึงราคาเลย ลดราคาจนห้องเต็มก็ได้ค่าสูง ถ้าดีมานด์ตลาดต่ำแต่ห้องคุณเต็ม อาจแปลว่าตั้งราคาต่ำเกินไป${y.closed?` สัปดาห์นี้ปิดซ่อม ${y.closed} ห้องแต่ยังนับเป็นห้องที่มีขาย`:''}</p>
  <p class="small muted">ที่มา: ${src('chekin','Chekin (สูตร)')}, ${src('raft','RaftLabs')}, ${src('rpgRev','RoomPriceGenie')}</p></details></div>
 <div class="kpi"><div class="name">ADR (ราคาเฉลี่ยที่ขายได้)</div><div class="num">${y.sold?fmt(y.adr):'–'}</div><div class="vs">${arrow(y.adr,c.adr)} คู่แข่งเฉลี่ย ${fmt(c.adr)} ฿ · ราคาที่ตั้ง ${fmt(y.price.wd)} / ${fmt(y.price.we)} ฿</div>
  <details><summary>อ่านค่านี้อย่างไร</summary><p><b>ความหมาย:</b> ราคาเฉลี่ยที่ขายได้จริงต่อห้องที่ขายได้ ไม่ใช่ราคาที่ตั้งไว้ ในเกมนี้ ADR อยู่ระหว่างราคาวันธรรมดากับสุดสัปดาห์ ขึ้นกับว่าขายช่วงไหนได้มากกว่า</p>
  <p><b>คำนวณสัปดาห์นี้:</b> <span class="calc">${fmt(y.revenue)} ÷ ${y.sold} = ${y.sold?fmt(y.adr):'–'}</span></p><p><b>ทำไมสำคัญ:</b> วัดอำนาจการตั้งราคา ต้องอ่านคู่กับ Occupancy เสมอ</p><p><b>ข้อควรระวัง:</b> นับเฉพาะห้องที่ขายได้ สัปดาห์ที่ขายได้น้อยแต่ราคาสูงจึงดูดีเกินจริง</p>
  <p class="small muted">ที่มา: ${src('rpgAdr','RoomPriceGenie (สูตร)')}, ${src('axis','AxisRooms')}, ${src('akia','Akia')}</p></details></div>
 <div class="kpi"><div class="name">RevPAR (รายได้ต่อห้องที่มีขาย)</div><div class="num">${fmt(y.revpar)}</div><div class="vs">${arrow(y.revpar,c.revpar)} คู่แข่งเฉลี่ย ${fmt(c.revpar)} ฿</div>
  <details><summary>อ่านค่านี้อย่างไร</summary><p><b>ความหมาย:</b> รายได้ห้องพักเฉลี่ยต่อห้องที่เปิดขายทั้งหมด รวมห้องที่ว่างด้วย</p><p><b>คำนวณสัปดาห์นี้:</b> <span class="calc">${fmt(y.revenue)} ÷ ${avail} = ${fmt(y.revpar)}</span> หรือ <span class="calc">ADR ${y.sold?fmt(y.adr):0} × Occ ${pct(y.occ)}</span></p>
  <p><b>ทำไมสำคัญ:</b> รวมราคาและยอดขายไว้ในตัวเลขเดียว จึงตอบได้ว่าการลดราคาเพื่อเพิ่มคนพักคุ้มหรือไม่</p><p><b>ข้อควรระวัง:</b> ไม่ใช่ตัววัดกำไร และนับเฉพาะรายได้ห้องพัก ดูกำไรในส่วนการเงินด้านล่าง</p>
  <p class="small muted">ที่มา: ${src('rpgRev','RoomPriceGenie (สูตร)')}, ${src('akia','Akia')}</p></details></div>
 <div class="kpi"><div class="name">RGI (ดัชนี RevPAR เทียบคู่แข่ง)</div><div class="num ${i.rgi>=100?'up':'down'}">${Math.round(i.rgi)}</div><div class="vs">MPI ${Math.round(i.mpi)} · ARI ${Math.round(i.ari)} · 100 = ได้ส่วนแบ่งตามที่ควรได้</div>
  <details><summary>อ่านค่านี้อย่างไร</summary><p><b>ความหมาย:</b> RevPAR ของคุณหารด้วย RevPAR เฉลี่ยของกลุ่มคู่แข่ง × 100 ค่า 100 คือได้ส่วนแบ่งรายได้ตามที่ควรได้ (fair share) มากกว่า 100 คือได้มากกว่าที่คาด น้อยกว่า 100 คือน้อยกว่าที่คาด</p>
  <p><b>คำนวณสัปดาห์นี้:</b> <span class="calc">${fmt(y.revpar)} ÷ ${fmt(c.revpar)} × 100 = ${Math.round(i.rgi)}</span></p>
  <p><b>แยกดูสาเหตุ:</b> MPI = Occupancy เทียบคู่แข่ง, ARI = ADR เทียบคู่แข่ง และ RGI = MPI × ARI ÷ 100 <span class="calc">${Math.round(i.mpi)} × ${Math.round(i.ari)} ÷ 100 ≈ ${Math.round(i.mpi*i.ari/100)}</span></p>
  <p><b>ทำไมสำคัญ:</b> ทุกโรงแรมในเมืองเจอฤดูกาลและเหตุการณ์ชุดเดียวกัน RGI จึงวัดฝีมือการบริหาร ไม่ใช่ดวง</p><p><b>ข้อควรระวัง:</b> ค่าที่ถือว่าดีขึ้นกับว่าเทียบกับคู่แข่งกลุ่มไหน ในเกมนี้คือโรงแรมบอท 3 แห่ง</p>
  <p class="small muted">ที่มา: ${src('str','STR Glossary')}, ${src('ehl','EHL Insights')}, ${src('chekin','Chekin')}, ${src('ehl2','EHL: RevPAR')}</p></details></div></div>`;}
function quadrantSVG(){const W=380,H=300,pl=58,pb=58,pt=12,pr=12;
  const X=v=>pl+(clamp(v,40,160)-40)/120*(W-pl-pr),Y=v=>pt+(1-(clamp(v,40,160)-40)/120)*(H-pt-pb);const pts=LOG.map(r=>[X(r.mpi),Y(r.ari)]);
  const trail=pts.length>1?`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="3 3"/>`:'';
  const dots=pts.map((p,k)=>`<circle cx="${p[0]}" cy="${p[1]}" r="${k===pts.length-1?7:3}" fill="${k===pts.length-1?'var(--lamp)':'var(--muted)'}" stroke="var(--line)" stroke-width="${k===pts.length-1?2:0}"/>`).join('');
  const ticks=[60,100,140].map(v=>`<text x="${X(v)}" y="${H-pb+14}" text-anchor="middle" class="lbl">${v}</text><text x="${pl-6}" y="${Y(v)+4}" text-anchor="end" class="lbl">${v}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="ตำแหน่ง MPI และ ARI ของคุณ"><rect x="${pl}" y="${pt}" width="${W-pl-pr}" height="${H-pt-pb}" fill="none" stroke="var(--soft)"/>
  <line x1="${X(100)}" x2="${X(100)}" y1="${pt}" y2="${H-pb}" stroke="var(--line)"/><line x1="${pl}" x2="${W-pr}" y1="${Y(100)}" y2="${Y(100)}" stroke="var(--line)"/>
  <text x="${X(130)}" y="${Y(152)}" text-anchor="middle" class="lbl">ชนะทั้งราคาและยอดขาย</text><text x="${X(130)}" y="${Y(45)}" text-anchor="middle" class="lbl">ขายได้มาก แต่ราคาต่ำ</text>
  <text x="${X(70)}" y="${Y(152)}" text-anchor="middle" class="lbl">ราคาสูง แต่ขายได้น้อย</text><text x="${X(70)}" y="${Y(45)}" text-anchor="middle" class="lbl">ตามหลังทั้งสองด้าน</text>${ticks}
  <text x="${(pl+W-pr)/2}" y="${H-26}" text-anchor="middle" class="lbl" style="font-weight:700;fill:var(--ink)">แกน X: MPI ดัชนีส่วนแบ่งการเข้าพัก →</text>
  <text x="${(pl+W-pr)/2}" y="${H-10}" text-anchor="middle" class="lbl">Occupancy ของคุณ ÷ คู่แข่ง × 100</text>
  <text transform="translate(16 ${(pt+H-pb)/2}) rotate(-90)" text-anchor="middle" class="lbl" style="font-weight:700;fill:var(--ink)">แกน Y: ARI ดัชนีราคาเฉลี่ย →</text>
  <text transform="translate(30 ${(pt+H-pb)/2}) rotate(-90)" text-anchor="middle" class="lbl">ADR ของคุณ ÷ คู่แข่ง × 100</text>${trail}${dots}</svg>`;}
function quadLegend(){return `<div class="legendbox"><b>MPI</b> (Market Penetration Index) ดัชนีส่วนแบ่งการเข้าพัก: Occupancy ของคุณเทียบคู่แข่ง × 100 เกิน 100 = ขายห้องได้มากกว่าส่วนแบ่งที่ควรได้<br>
  <b>ARI</b> (Average Rate Index) ดัชนีราคาเฉลี่ย: ADR ของคุณเทียบคู่แข่ง × 100 เกิน 100 = ขายได้ราคาเฉลี่ยสูงกว่าคู่แข่ง<br>
  จุดใหญ่สีเหลือง = สัปดาห์นี้ เส้นประ = เส้นทางสัปดาห์ก่อนๆ เส้นตรงกลาง = 100 <span class="muted">(ที่มา: ${src('ehl','EHL Insights')}, ${src('chekin','Chekin')})</span></div>`;}
function diagnose(o){const y=o.hotels.you,c=o.comp,i=o.idx,out=[];
  if(i.mpi>=100&&i.ari>=100)out.push(`ชนะคู่แข่งทั้งยอดขาย (MPI ${Math.round(i.mpi)}) และราคา (ARI ${Math.round(i.ari)}) รักษาสมดุลนี้ไว้ และดูว่าพนักงานรับภาระไหวหรือไม่`);
  else if(i.mpi>=100)out.push(`ขายห้องได้มากกว่าคู่แข่ง (MPI ${Math.round(i.mpi)}) แต่ราคาเฉลี่ยต่ำกว่า (ARI ${Math.round(i.ari)}) แปลว่ากำลังใช้ราคาซื้อยอดขาย ลองขึ้นราคาทีละน้อยแล้วดูว่า RGI ดีขึ้นไหม (${src('chekin','ที่มา')})`);
  else if(i.ari>=100)out.push(`ราคาเฉลี่ยสูงกว่าคู่แข่ง (ARI ${Math.round(i.ari)}) แต่ขายได้น้อยกว่า (MPI ${Math.round(i.mpi)}) ตรวจว่าราคาเกินงบของกลุ่มลูกค้าหลักหรือไม่ หรือการรับรู้และดาวรีวิวยังไม่พอ (${src('rpgRev','ที่มา')})`);
  else out.push(`ตามหลังคู่แข่งทั้งยอดขาย (MPI ${Math.round(i.mpi)}) และราคา (ARI ${Math.round(i.ari)}) ปัญหามักอยู่ที่การรับรู้ของลูกค้าหรือชื่อเสียง มากกว่าราคา`);
  if(y.occ>.9)out.push(`ห้องแทบเต็มทั้งสัปดาห์ (${pct(y.occ)}) มักเป็นสัญญาณว่ายังขึ้นราคาได้ (${src('rpgRev','ที่มา')})`);
  if(y.occP.we>.93&&y.occP.wd<.6)out.push(`สุดสัปดาห์เต็ม (${pct(y.occP.we)}) แต่วันธรรมดาว่าง (${pct(y.occP.wd)}) ลองตั้งราคาสุดสัปดาห์สูงขึ้น และหาลูกค้าวันธรรมดา เช่น นักธุรกิจ`);
  const nx=G.week<WEEKS?G.timeline[G.week].scheduled:[];if(nx.length)out.push(`สัปดาห์หน้ามี ${nx.map(e=>e.name).join(', ')} ที่ประกาศล่วงหน้า ลองปรับราคาก่อนคู่แข่ง แต่ระวังข่าวยกเลิก`);
  if(y.adequacy<.8&&y.sold>0)out.push('พนักงานไม่พอกับจำนวนแขก บริการจึงลดลง');
  if(y.lang<45&&CITIES[G.city].foreign>.3)out.push(`ทีมพูดภาษาต่างประเทศได้น้อย (เฉลี่ย ${Math.round(y.lang)}) ในเมืองที่มีแขกต่างชาติมาก`);
  if(y.revenue>0&&y.commission/y.revenue>.08)out.push(`ค่าคอมมิชชัน OTA กิน ${pct(y.commission/y.revenue)} ของรายได้ห้องพัก`);
  if(y.teamSat<50&&y.staffN)out.push(`ความพึงพอใจพนักงานต่ำ (${Math.round(y.teamSat)}) ถ้าต่ำกว่า 40 จะเริ่มมีคนลาออก`);
  if(y.cash<0)out.push('เงินสดติดลบ เสียดอกเบี้ย 1% ต่อสัปดาห์ และโรงแรมที่ขาดทุนสะสมจะถูกจัดอันดับต่อท้ายโรงแรมที่มีกำไร');return out;}
function causeEffect(o){const y=o.hotels.you,out=[];const bots=G.hotels.filter(h=>!h.isPlayer).map(h=>o.hotels[h.id]);const x={tmd:tmdSeason(o.info.month,o.info.day),lab:seasonLabel(o.season)};
  out.push(`ฤดูกาล: ${TMD_NAME[x.tmd]} / ${SEASON_NAME[x.lab]}ของ${CITIES[G.city].name} ดีมานด์ ×${o.season.toFixed(2)}`);
  o.tl.scheduled.forEach(e=>out.push(e.cancelled?`อีเวนต์ "${e.name}" ถูกยกเลิกกะทันหัน ดีมานด์ที่คาดไว้ไม่เกิดขึ้น (โรงแรมที่ขึ้นราคารอไว้เสียเปรียบ)`:`อีเวนต์ที่ประกาศล่วงหน้า "${e.name}": ${schedText(e)}`));
  o.tl.shocks.forEach(s=>out.push(`${s.ev.positive?'▲':'▼'} เหตุการณ์ "${s.ev.name}" (${CATS[s.ev.cat]}, ${phaseName(s.k,s.d,s.perm)}${s.perm?'':` สัปดาห์ ${s.k+1}/${s.d}`}): ${s.ev.text} ผลเต็มที่: ${effText(s.ev.eff)} (เกิดกับทุกโรงแรมในเมือง)`));
  if(!o.tl.shocks.length&&!o.tl.scheduled.length)out.push('ไม่มีอีเวนต์หรือเหตุการณ์ฉุกเฉินสัปดาห์นี้');
  y.crises.forEach(c=>out.push(`▼ วิกฤตภายในโรงแรมคุณ: ${c.name} (${c.detail})`));
  const cP=bots.reduce((a,b)=>a+(b.price.wd*5+b.price.we*2)/7,0)/bots.length,yP=(y.price.wd*5+y.price.we*2)/7;
  out.push(`ราคาเฉลี่ยที่ตั้ง ${fmt(yP)} ฿ เทียบคู่แข่ง ${fmt(cP)} ฿ (${yP>=cP?'สูงกว่า':'ต่ำกว่า'} ${Math.abs(Math.round((yP/cP-1)*100))}%)`);
  const cAw=bots.reduce((a,b)=>a+b.awAvg,0)/bots.length;out.push(`การรับรู้ของลูกค้า ${Math.round(y.awAvg*100)}% เทียบคู่แข่ง ${Math.round(cAw*100)}%`);
  if(y.sold>0)out.push(`บริการที่ส่งมอบ ${Math.round(y.Q)} เทียบความคาดหวัง ${Math.round(y.E)} → รีวิวสัปดาห์นี้ ${y.rating.toFixed(1)} ดาว ดาวสะสม ${y.R.toFixed(2)}`);
  if(y.inf!=='none')out.push(`อินฟลูเอนเซอร์: ความน่าเชื่อถือที่ได้จริง ${y.infCred.toFixed(2)} เท่า${y.notes.includes('infBad')?' แต่รีวิวจากแขกต่ำกว่า 3 ดาว ดาวลด 0.25':''}`);
  if(y.fake)out.push(y.caught?`รีวิวปลอมถูกตรวจพบ: ปรับ ${fmt(COST.fine)} ฿ ดาวลด 0.7 และถูกระงับจาก OTA 3 สัปดาห์`:'รีวิวปลอมยังไม่ถูกตรวจพบ แต่ความเสี่ยงมีทุกสัปดาห์');
  out.push(`พนักงาน ${y.staffN} คน รับแขกเฉลี่ย ${y.staffN?Math.round(y.load):0} ห้อง-คืนต่อคน ความพึงพอใจ ${Math.round(y.teamSat)}${y.quits.length?` ลาออก: ${y.quits.join(', ')}`:''}`);
  o.news.forEach(n=>out.push('ข่าวคู่แข่ง: '+esc(n)));return out;}
function lineChart(series,labels,opt={}){const W=600,H=opt.h||190,pl=48,pr=12,pt=12,pb=26;const all=series.flatMap(s=>s.values).concat(opt.ref!=null?[opt.ref]:[]);
  const mn=opt.min!=null?opt.min:0,mx=Math.max(...all,1)*1.12;const X=i=>pl+(labels.length<=1?(W-pl-pr)/2:i/(labels.length-1)*(W-pl-pr)),Y=v=>pt+(1-(v-mn)/(mx-mn))*(H-pt-pb);
  let g='';for(let k=0;k<=4;k++){const v=mn+(mx-mn)*k/4;g+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" class="ax"/><text x="${pl-6}" y="${Y(v)+4}" text-anchor="end" class="lbl">${mx<10?v.toFixed(1):fmt(v)}</text>`;}
  labels.forEach((l,i)=>g+=`<text x="${X(i)}" y="${H-8}" text-anchor="middle" class="lbl">${l}</text>`);
  if(opt.ref!=null)g+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(opt.ref)}" y2="${Y(opt.ref)}" stroke="var(--line)" stroke-dasharray="5 4"/><text x="${W-pr}" y="${Y(opt.ref)-5}" text-anchor="end" class="lbl">${opt.refLabel||''}</text>`;
  series.forEach(s=>{g+=`<polyline points="${s.values.map((v,i)=>`${X(i)},${Y(v)}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.5"/>`+s.values.map((v,i)=>`<circle cx="${X(i)}" cy="${Y(v)}" r="3.5" fill="${s.color}"/>`).join('');});
  return `<div class="legend">${series.map(s=>`<span style="--c:${s.color}">${s.name}</span>`).join('')}</div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${opt.aria||''}">${g}</svg>`;}
function compTable(o){const rows=G.hotels.map(h=>{const r=o.hotels[h.id];return `<tr class="${h.isPlayer?'you':''}"><td>${esc(h.name)}${h.isPlayer?' (คุณ)':''}</td><td>${fmt(r.price.wd)} / ${fmt(r.price.we)}</td><td>${pct(r.occ)}</td><td>${r.sold?fmt(r.adr):'–'}</td><td>${fmt(r.revpar)}</td><td>${r.R.toFixed(2)}</td></tr>`;}).join('');
  return `<div class="tablewrap"><table><thead><tr><th>โรงแรม</th><th>ราคา ธรรมดา/สุดสัปดาห์</th><th>Occ</th><th>ADR</th><th>RevPAR</th><th>ดาว</th></tr></thead><tbody>${rows}<tr><td class="muted">ค่าเฉลี่ยคู่แข่ง</td><td></td><td>${pct(o.comp.occ)}</td><td>${fmt(o.comp.adr)}</td><td>${fmt(o.comp.revpar)}</td><td></td></tr></tbody></table></div>`;}
function segMix(y){const tot=SEGMENTS.reduce((a,s)=>a+(y.seg[s.id]||0),0)||1;return `<div class="segbar">${SEGMENTS.map(s=>`<span style="width:${(y.seg[s.id]||0)/tot*100}%;background:${SEG_COLOR[s.id]}"></span>`).join('')}</div><div class="legend">${SEGMENTS.map(s=>`<span style="--c:${SEG_COLOR[s.id]}">${s.name} ${Math.round((y.seg[s.id]||0)/tot*100)}%</span>`).join('')}</div>`;}
function tabReport(){if(!LAST)return `<div class="panel"><h2>รายงานผลจะแสดงที่นี่</h2><p>ตั้งราคา จ้างพนักงานอย่างน้อย 1 คน เลือกการตลาด แล้วกด "จบสัปดาห์" ระบบจะคำนวณการจองของทุกโรงแรมพร้อมกันและอธิบายผลด้วยตัวชี้วัด 4 ตัว</p></div>`;
  const o=LAST,y=o.hotels.you,i=o.idx;const labels=LOG.map(r=>'ส.'+r.week);const c=y.costs;
  const headline=`สัปดาห์ที่ ${o.week} (${o.info.label}): RGI ${Math.round(i.rgi)} คุณทำรายได้ต่อห้อง${i.rgi>=100?'มากกว่า':'น้อยกว่า'}ค่าเฉลี่ยคู่แข่ง ${Math.abs(Math.round(i.rgi-100))}%`;
  const costRows=[['ต้นทุนคงที่ (ค่าเช่า ค่าน้ำไฟ)',c.fixed],['ต้นทุนต่อห้อง-คืน',c.variable],['เงินเดือน',c.salaries],['โบนัส',c.bonus],['ชดเชยให้ออก',c.severance],['การตลาด',c.marketing],['ค่าคอมมิชชัน OTA',c.commission],['รีวิวปลอม',c.fake],['ค่าปรับ',c.fine],['ค่าซ่อม/ชดเชยแขก',c.crisis],['ดอกเบี้ย',c.interest]].filter(r=>r[1]>0).map(r=>`<tr><td>${r[0]}</td><td>${fmt(r[1])}</td></tr>`).join('');
  return `<div class="panel"><div class="headline">${headline}</div><div style="display:grid;grid-template-columns:minmax(120px,200px) 1fr;gap:14px;align-items:center;margin-bottom:10px">${buildingSVG(y.occ,y.closed)}<div>${segMix(y)}<p class="note">ไฟในตึกเปิดตาม Occupancy สัปดาห์นี้ สีแดง = ห้องปิดซ่อม</p></div></div>${kpiCards(o)}</div>
  <div class="two"><div class="panel"><h2>ตำแหน่งของคุณ: ยอดขาย × ราคา เทียบคู่แข่ง</h2><div class="chart" style="max-width:460px">${quadrantSVG()}</div>${quadLegend()}</div>
  <div class="panel"><h2>ผลวิเคราะห์</h2><ul class="list">${diagnose(o).map(t=>`<li>${t}</li>`).join('')}</ul><h2 style="margin-top:14px">เหตุ → ผล สัปดาห์นี้</h2><ul class="list">${causeEffect(o).map(t=>`<li>${t}</li>`).join('')}</ul></div></div>
  <div class="two"><div class="panel"><h2>เทียบกับคู่แข่ง</h2>${compTable(o)}<h3>RevPAR รายสัปดาห์</h3><div class="chart">${lineChart([{name:'คุณ',color:'var(--jade)',values:LOG.map(r=>r.revpar)},{name:'ค่าเฉลี่ยคู่แข่ง',color:'var(--muted)',values:LOG.map(r=>r.cRevpar)}],labels,{aria:'RevPAR รายสัปดาห์'})}</div>
   <h3>RGI รายสัปดาห์</h3><div class="chart">${lineChart([{name:'RGI ของคุณ',color:'var(--lamp)',values:LOG.map(r=>r.rgi)}],labels,{ref:100,refLabel:'100 = ส่วนแบ่งที่ควรได้',aria:'RGI รายสัปดาห์'})}</div></div>
  <div class="panel"><h2>การเงินสัปดาห์นี้</h2><div class="tablewrap"><table><tbody><tr><td><b>รายได้ห้องพัก</b></td><td><b>${fmt(y.revenue)}</b></td></tr>${costRows}<tr><td><b>กำไรสัปดาห์นี้</b></td><td class="${y.profit>=0?'up':'down'}"><b>${fmt(y.profit)}</b></td></tr><tr><td>เงินสดคงเหลือ</td><td>${fmt(y.cash)}</td></tr></tbody></table></div>
   <p class="note">RevPAR วัดรายได้ห้องพัก ไม่ใช่กำไร โรงแรมที่ RevPAR สูงอาจขาดทุนได้ถ้าต้นทุนสูง</p>
   <h2 style="margin-top:14px">คำถามชวนคิดก่อนสัปดาห์หน้า</h2><p>${PROMPTS[(o.week-1)%PROMPTS.length]}</p><p class="note">การเรียนรู้จากเกมจำลองเกิดมากในช่วงสรุปบทเรียนหลังเล่น (${src('crookall','Crookall, 2010')})</p></div></div>`;}
