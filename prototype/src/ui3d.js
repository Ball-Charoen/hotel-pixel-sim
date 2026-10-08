/* ---------- events library tab ---------- */
let FREQ=null;
function citiesFor(s){const ids=Object.keys(CITIES).filter(id=>s.where(CITIES[id]));return ids.length===9?'ทุกเมือง':ids.map(id=>CITIES[id].name).join(', ');}
function shockRows(cat){const ch=CHAOS[G.chaos];return SHOCKS.filter(s=>s.cat===cat).map(s=>{const wt=s.w*ch.sevW[s.sev]*(s.wf?s.wf(CITIES[G.city]):1);const here=s.where(CITIES[G.city]);
  return `<tr><td>${s.positive?'▲':'▼'} <b>${s.name}</b><br><span class="small muted">${s.text}</span></td><td>${SEV[s.sev]}</td><td class="small">${citiesFor(s)}${s.months?`<br>เฉพาะ ${s.months.map(m=>TH_MONTH[m]).join(' ')}`:''}</td><td>${s.perm?'ถาวร':s.dur[0]===s.dur[1]?s.dur[0]+' สัปดาห์':s.dur[0]+'–'+s.dur[1]+' สัปดาห์'}${s.repeat?'<br><span class="small muted">เกิดซ้ำได้ เว้น 4 สัปดาห์</span>':''}</td><td class="small">${effText(s.eff)}</td><td>${here&&wt>0?wt.toFixed(2):'<span class="muted">0</span>'}</td></tr>`;}).join('');}
function runFreq(){const n=300,cnt={},cat={macro:0,political:0,industry:0};let tot=0,neg=0,pos=0;
  for(let i=0;i<n;i++){const g={city:G.city,startMonth:G.startMonth,chaos:G.chaos};const tl=buildTimeline(g,mulberry32(hashSeed('freq'+i)));
    tl.forEach(t=>t.shocks.filter(x=>x.k===0).forEach(x=>{cnt[x.ev.id]=(cnt[x.ev.id]||0)+1;cat[x.ev.cat]++;tot++;x.ev.positive?pos++:neg++;}));}
  FREQ={n,tot,cat,pos,neg,top:Object.entries(cnt).sort((a,b)=>b[1]-a[1]).map(([id,c])=>({s:SHOCKS.find(x=>x.id===id),c}))};}
function tabEvents(){const ch=CHAOS[G.chaos];
  const nat=NATIONAL.filter(e=>!e.city||e.city===G.city).map(e=>`<tr><td><b>${e.name}</b><br><span class="small muted">${e.text}</span></td><td>${e.d} ${TH_MONTH[e.m]}${e.id==='loykrathong'||e.id==='cny'?' (โดยประมาณ)':''}</td><td class="small">${schedText(e)}</td></tr>`).join('');
  const seeded=SEEDED.map(e=>`<tr><td><b>${e.name}</b><br><span class="small muted">${e.text}</span></td><td class="small">${schedText(e)}</td></tr>`).join('');
  const freq=FREQ?`<p>จำลองเกม ${FREQ.n} เกมใน${CITIES[G.city].name} เริ่มเดือน${TH_MONTH_FULL[G.startMonth]} ระดับ${ch.name}: เกิดเหตุการณ์ใหม่เฉลี่ย <b>${(FREQ.tot/FREQ.n).toFixed(1)}</b> ครั้งต่อเกม (ร้าย ${(FREQ.neg/FREQ.n).toFixed(1)} · ดี ${(FREQ.pos/FREQ.n).toFixed(1)})</p>
   <p class="small">ตามหมวด: ${Object.entries(FREQ.cat).map(([k,v])=>`${CATS[k]} ${(v/FREQ.n).toFixed(2)}`).join(' · ')} ครั้ง/เกม · ปัญหาภายในที่พักคำนวณแยกระหว่างเล่น</p>
   ${FREQ.top.slice(0,12).map(t=>hbar(t.s.name,t.c/FREQ.n*100,null,Math.max(...FREQ.top.map(x=>x.c/FREQ.n*100)),(t.c/FREQ.n*100).toFixed(0)+'%')).join('')}<p class="note">แถบ = โอกาสที่เหตุการณ์นั้นจะเกิดอย่างน้อยหนึ่งครั้งในเกม (โดยประมาณ)</p>`:'';
  return `<div class="panel"><h2>คลังเหตุการณ์และวิธีสุ่ม</h2>
  <p>เหตุการณ์แบ่งตามกรอบการจัดการภาวะวิกฤตการท่องเที่ยวของ Faulkner (2001): <b>ภัยพิบัติ (disaster)</b> คือการเปลี่ยนแปลงฉับพลันที่ธุรกิจควบคุมไม่ได้ ส่วน <b>วิกฤต (crisis)</b> มีสาเหตุส่วนหนึ่งจากการบริหารของธุรกิจเอง (${src('faulkner','ที่มา')}) เหตุการณ์หลายสัปดาห์ในเกมจะแรงสุดในสัปดาห์แรก (ฉุกเฉิน) แล้วค่อยๆ ฟื้นตัว ตามแนวคิดระยะของภัยพิบัติ (${src('faulknerPhases','ที่มา')})</p>
  <h3>วิธีสุ่ม (ระดับ${ch.name})</h3><ul class="list">
   <li>สุ่มตารางเหตุการณ์ทั้งเกมครั้งเดียวตอนเริ่มจากรหัสเกม ทุกโรงแรมในเมืองเจอชุดเดียวกัน</li>
   <li>แต่ละสัปดาห์มีโอกาส ${Math.round(ch.p*100)}% ที่จะเกิดเหตุการณ์ใหม่ (สุ่มได้สูงสุด ${ch.max} ครั้งต่อสัปดาห์)</li>
   <li>เลือกเหตุการณ์จากคลังแบบถ่วงน้ำหนัก กรองตามเมืองและเดือน น้ำหนักตามความรุนแรงที่ระดับนี้: เล็ก ×${ch.sevW.minor}, ใหญ่ ×${ch.sevW.major}, รุนแรงมาก ×${ch.sevW.cat}</li>
   <li>เหตุการณ์ใหญ่และรุนแรงมากเกิดได้ครั้งเดียวต่อเกม เหตุการณ์เล็กบางอย่างเกิดซ้ำได้แต่ต้องเว้น 4 สัปดาห์ และจะไม่สุ่มซ้ำขณะยังมีผลอยู่</li>
   <li>ผลกระทบคูณด้วยตัวคูณความรุนแรงของระดับนี้ (×${ch.scale}) และลดลงตามระยะฟื้นตัว</li>
   <li>ปัญหาภายในที่พักสุ่มแยกรายโรงแรมทุกสัปดาห์ โอกาสสูงขึ้นตามการบริหารของโรงแรมนั้นเอง</li></ul>
  <button class="btn ghost" type="button" data-act="freq">จำลองความถี่ 300 เกม</button>${freq}
  <details style="margin-top:12px"><summary>เฉลยตารางเหตุการณ์ของเกมนี้ (สำหรับผู้สอน)</summary><label class="row" style="justify-content:flex-start"><input type="checkbox" data-act="reveal" ${REVEAL?'checked':''}> แสดงเหตุการณ์ฉุกเฉินที่จะเกิดในปฏิทิน (ผู้เล่นจะเห็นคำตอบล่วงหน้า)</label></details></div>
  <div class="panel"><h2>ที่มาของฤดูกาลในเกม</h2><p class="small">ฤดูกาลไทยแบ่งตาม ${src('tmd','สสช./กรมอุตุนิยมวิทยา')} ช่วงไฮซีซั่น กึ่งไฮซีซั่น และโลว์ซีซั่นของแต่ละเมืองเป็นค่าออกแบบที่อิงข้อมูลสภาพอากาศท่องเที่ยว เช่น ${src('phuket','ภูเก็ต')}, ${src('ranong','ระนอง')} เมืองอื่นเป็นค่าประมาณ ควรปรับด้วยสถิติรายเดือนภายหลัง</p></div>
  <div class="panel evcat"><h2>อีเวนต์ที่รู้ล่วงหน้า</h2><h3>เทศกาลประจำปี (ตามวันที่จริง)</h3><div class="tablewrap"><table><thead><tr><th>อีเวนต์</th><th>วันที่</th><th>ผลต่อดีมานด์</th></tr></thead><tbody>${nat}</tbody></table></div>
  <p class="note">วันที่เทศกาลอ้างอิง ${src('festival','ปฏิทินเทศกาลภูเก็ต')} ลอยกระทงและตรุษจีนเปลี่ยนทุกปี เกมใช้วันโดยประมาณ</p>
  <h3>อีเวนต์ของเมือง (สุ่มสัปดาห์ ประกาศตั้งแต่ต้นเกม 2–3 งาน มีโอกาสถูกยกเลิก ${Math.round(CANCEL_P*100)}%)</h3><div class="tablewrap"><table><thead><tr><th>อีเวนต์</th><th>ผลต่อดีมานด์</th></tr></thead><tbody>${seeded}</tbody></table></div></div>
  ${['macro','political','industry'].map(k=>`<div class="panel evcat"><h2>เหตุการณ์ฉุกเฉิน: ${CATS[k]}</h2><div class="tablewrap"><table><thead><tr><th>เหตุการณ์</th><th>ความรุนแรง</th><th>เกิดที่</th><th>ระยะเวลา</th><th>ผลเต็มที่</th><th>น้ำหนักใน${CITIES[G.city].name}</th></tr></thead><tbody>${shockRows(k)}</tbody></table></div></div>`).join('')}
  <div class="panel evcat"><h2>ปัญหาภายในที่พัก (วิกฤตที่เกิดจากการบริหาร)</h2><div class="tablewrap"><table><thead><tr><th>เหตุการณ์</th><th>โอกาสเกิดต่อสัปดาห์</th><th>ผล</th></tr></thead><tbody>
   <tr><td><b>${INTERNAL[0].name}</b><br><span class="small muted">${INTERNAL[0].variants.join(' / ')}</span></td><td>2% + 8% ถ้ารีวิวสัปดาห์ก่อนต่ำกว่า 3 ดาว + 4% ถ้าพนักงานไม่พอ</td><td>ดาวลด 0.45 ทันที</td></tr>
   <tr><td><b>${INTERNAL[1].name}</b></td><td>15% ถ้า Occupancy สัปดาห์ก่อนเกิน 92%</td><td>ชดเชยแขก ${fmt(COST.overbook)} ฿ ดาวลด 0.2</td></tr>
   <tr><td><b>${INTERNAL[2].name}</b></td><td>3%</td><td>ค่าซ่อม ${fmt(COST.repair)} ฿ ขายได้ 6 ห้อง นาน 2 สัปดาห์</td></tr>
   <tr><td><b>${INTERNAL[3].name}</b></td><td>30% ถ้าราคาเฉลี่ยเกินคู่แข่ง 60% ในสัปดาห์ที่มีอีเวนต์</td><td>ดาวลด 0.25</td></tr></tbody></table></div>
   <p class="note">ช่วงโลว์ซีซั่นไม่ได้อยู่ในการสุ่ม เพราะเป็นไปตามฤดูกาลจริงของเมืองในแท็บตลาดและปฏิทิน ค่าผลกระทบทั้งหมดเป็นค่าออกแบบเพื่อการเรียนรู้ ไม่ได้ประมาณจากข้อมูลจริง</p></div>`;}
/* ---------- final ---------- */
function finalHTML(){const fs=finalScores(G);const rank=fs.findIndex(f=>f.id==='you')+1;const avg=k=>LOG.reduce((a,r)=>a+r[k],0)/LOG.length;
  const rows=fs.map((f,k)=>{const h=G.hotels.find(x=>x.id===f.id);return `<tr class="${f.id==='you'?'you':''}"><td>${k+1}. ${esc(f.name)}${f.id==='you'?' (คุณ)':''}</td><td>${Math.round(f.score)}</td><td>${Math.round(f.fin)}</td><td>${Math.round(f.rep)}</td><td>${Math.round(f.staff)}</td><td class="${f.profit>0?'up':'down'}">${fmt(f.profit)}</td><td>${h.isPlayer?'–':`${ARCH[h.arch].name} · ฝีมือ${SKILL[h.skill].name}`}</td></tr>`;}).join('');
  const csv=['week,date,price_wd,price_we,staff,bonus,billboard,online,influencer,ota,fake,occ,adr,revpar,mpi,ari,rgi,rating,profit'].concat(LOG.map(r=>[r.week,'"'+r.date+'"',r.pwd,r.pwe,r.staff,r.bonus,r.bill,r.online,r.inf,r.ota?1:0,r.fake?1:0,(r.occ*100).toFixed(1),Math.round(r.adr),Math.round(r.revpar),Math.round(r.mpi),Math.round(r.ari),Math.round(r.rgi),r.rating.toFixed(2),Math.round(r.profit)].join(','))).join('\n');
  return `<div class="panel"><h1>จบ 12 สัปดาห์ที่${CITIES[G.city].name}: คุณได้อันดับ ${rank} จาก ${fs.length}</h1>
  <p>เฉลี่ยตลอดเกม: Occupancy ${pct(avg('occ'))} · ADR ${fmt(avg('adr'))} ฿ · RevPAR ${fmt(avg('revpar'))} ฿ · RGI ${Math.round(avg('rgi'))}</p>
  <div class="tablewrap"><table><thead><tr><th>อันดับ</th><th>คะแนนรวม</th><th>การเงิน (50%)</th><th>ชื่อเสียง (35%)</th><th>พนักงาน (15%)</th><th>กำไรสะสม</th><th>เฉลยบอท</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="note">กติกา: (1) โรงแรมที่ขาดทุนสะสมจัดอันดับต่อท้ายโรงแรมที่มีกำไรเสมอ (2) คะแนนการเงิน = กำไรสะสม ÷ กำไรสูงสุดในเมือง × 100 ถ้าขาดทุนได้ 0 (3) ชื่อเสียงจากดาวรีวิว (4) พนักงานจากความพึงพอใจเฉลี่ย</p></div>
  <div class="two"><div class="panel"><h2>เส้นทางของคุณ</h2><div class="chart" style="max-width:460px">${quadrantSVG()}</div>${quadLegend()}</div>
  <div class="panel"><h2>คำถามสำหรับสรุปบทเรียน</h2><ul class="list"><li>สัปดาห์ไหน RGI ของคุณสูงสุดและต่ำสุด เกิดจาก MPI หรือ ARI?</li><li>คุณใช้ปฏิทินอีเวนต์และฤดูกาลตั้งราคาล่วงหน้าได้ดีแค่ไหน มีครั้งไหนที่อีเวนต์ถูกยกเลิกแล้วเสียหาย?</li>
   <li>เหตุการณ์ฉุกเฉินครั้งไหนกระทบคุณมากที่สุด คุณรับมือในช่วงฉุกเฉินและช่วงฟื้นตัวอย่างไร?</li><li>บอทสายไหนทำได้ดีที่สุดในเมืองนี้ เพราะเมืองนี้มีลูกค้ากลุ่มไหนมาก?</li><li>ถ้าดูแค่ Occupancy อย่างเดียว คุณจะตัดสินผลงานตัวเองผิดตรงไหน?</li></ul>
   <p class="note">การเรียนรู้จากเกมจำลองเกิดมากในช่วงสรุปบทเรียน (${src('crookall','Crookall, 2010')})</p>
   <div class="chart">${lineChart([{name:'RGI ของคุณ',color:'var(--lamp)',values:LOG.map(r=>r.rgi)}],LOG.map(r=>'ส.'+r.week),{ref:100,refLabel:'100 = ส่วนแบ่งที่ควรได้',aria:'RGI ตลอดเกม'})}</div></div></div>
  <div class="panel"><h2>บันทึกการตัดสินใจ (CSV)</h2><p class="note">คัดลอกไปวางใน Excel หรือ Google Sheets เพื่อใช้ตอนสรุปบทเรียน</p><textarea readonly aria-label="บันทึกการตัดสินใจ CSV">${csv}</textarea>
  <p style="margin-top:12px"><button class="btn" id="restart" type="button">เริ่มเกมใหม่</button></p></div>`;}
/* ---------- actions ---------- */
function endWeek(){const h=P();const x=weekCtx(G.week);
  const dec={week:G.week+1,date:x.wi.label,pwd:h.price.wd,pwe:h.price.we,staff:h.staff.length,bonus:h.bonus,bill:h.mk.billboard,online:h.mk.online,inf:h.inf,ota:h.ota&&h.otaBan===0,fake:h.fake};
  const o=simulateWeek(G);o.hotels.you.quits.forEach(n=>{const c=G.candidates.find(z=>z.name===n);if(c)c.gone=true;});const y=o.hotels.you;
  LOG.push(Object.assign(dec,{occ:y.occ,adr:y.adr,revpar:y.revpar,cRevpar:o.comp.revpar,mpi:o.idx.mpi,ari:o.idx.ari,rgi:o.idx.rgi,rating:y.rating,R:y.R,profit:y.profit,Q:y.Q,E:y.E,cQ:o.comp.Q}));
  LAST=o;TAB='report';renderGame();window.scrollTo(0,0);}
function setPath(obj,path,val){const k=path.split('.');let t=obj;for(let i=0;i<k.length-1;i++)t=t[k[i]];t[k[k.length-1]]=val;}
function rerender(keepScroll){const y=window.scrollY;renderGame();if(keepScroll)window.scrollTo(0,y);}
document.addEventListener('click',e=>{
  const cityEl=e.target.closest('[data-city]');if(cityEl&&!G){const id=cityEl.dataset.city;SETUP.city=id;SETUP.map=CITIES[id].map;SETUP.startMonth=+($('#smonth')?$('#smonth').value:SETUP.startMonth);SETUP.allowFake=$('#allowfake')?$('#allowfake').checked:SETUP.allowFake;renderSetup();return;}
  if(e.target.dataset&&e.target.dataset.overlay){closeInfo();return;}
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.tab){TAB=t.dataset.tab;renderGame();return;}
  if(t.dataset.act==='info'){INFO_OPEN=true;renderGame();const c=document.querySelector('[data-act="closeinfo"]');if(c)c.focus();return;}
  if(t.dataset.act==='closeinfo'){closeInfo();return;}
  if(t.dataset.step){const [k,d]=t.dataset.step.split(':');const r=document.querySelector(`input[type=range][data-k="${k}"]`);const h=P();
    const cur=k.split('.').reduce((o,x)=>o[x],h);const v=clamp(cur+Number(d),Number(r.min),Number(r.max));setPath(h,k,v);syncCtl(k,v);updateSpend();return;}
  if(t.dataset.set){SETUP.startMonth=+($('#smonth')?$('#smonth').value:SETUP.startMonth);SETUP.allowFake=$('#allowfake')?$('#allowfake').checked:SETUP.allowFake;
    SETUP[t.dataset.set]=t.dataset.v;if(t.dataset.set==='map')SETUP.city=MAPS[t.dataset.v].cities[0];renderSetup();return;}
  if(t.id==='start'){G=newGame({seed:$('#seed').value||'class',city:SETUP.city,startMonth:+$('#smonth').value,chaos:SETUP.chaos,allowFake:$('#allowfake').checked,hotelName:($('#hname').value||'โฮสเทลของฉัน').trim()});
    LAST=null;LOG=[];FREQ=null;REVEAL=false;TAB='market';renderGame();window.scrollTo(0,0);return;}
  if(t.dataset.staff){const h=P();const id=t.dataset.staff;const idx=h.staff.findIndex(s=>s.id===id);
    if(idx>=0){h.severance=(h.severance||0)+h.staff[idx].salary;h.staff.splice(idx,1);}else if(h.staff.length<4){const c=G.candidates.find(z=>z.id===id);c.sat=70;h.staff.push(c);}
    rerender(true);return;}
  if(t.id==='endweek'){if(G.week<WEEKS)endWeek();return;}
  if(t.dataset.act==='freq'){runFreq();const mb=document.querySelector('.modal-body');if(mb){const y=mb.scrollTop;mb.innerHTML=tabEvents();mb.scrollTop=y;}else rerender(true);return;}
  if(t.dataset.act==='final'){$('#app').innerHTML=finalHTML();window.scrollTo(0,0);return;}
  if(t.id==='restart'){G=null;LAST=null;LOG=[];renderSetup();window.scrollTo(0,0);return;}
});
function closeInfo(){INFO_OPEN=false;renderGame();const b=document.querySelector('[data-act="info"]');if(b)b.focus();}
function syncCtl(k,v){document.querySelectorAll(`[data-k="${k}"]`).forEach(n=>{if(n.type==='range'||n.type==='number'){if(n!==document.activeElement||n.type==='range')n.value=v;}if(n.type==='range')n.style.setProperty('--p',((v-n.min)/(n.max-n.min)*100).toFixed(1)+'%');});document.querySelectorAll(`[data-show="${k}"]`).forEach(b=>b.textContent=fmt(v)+' ฿');}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&INFO_OPEN){closeInfo();return;}if((e.key==='Enter'||e.key===' ')&&e.target.closest&&e.target.closest('[data-city]')&&!G){e.preventDefault();e.target.closest('[data-city]').dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset&&el.dataset.act==='reveal'){REVEAL=el.checked;return;}
  if(!el.dataset||!el.dataset.k||!G)return;const k=el.dataset.k;const h=P();
  if(el.type==='checkbox'){setPath(h,k,el.checked);rerender(true);return;}
  if(k==='inf'){h.inf=el.value;updateSpend();return;}
  let v=Number(el.value);if(!isFinite(v))return;if(k.startsWith('price'))v=clamp(Math.round(v/10)*10,200,4000);setPath(h,k,v);
  syncCtl(k,v);updateSpend();});
document.addEventListener('change',e=>{const el=e.target;if(el.type==='number'&&el.dataset&&el.dataset.k&&G){const v=el.dataset.k.split('.').reduce((o,x)=>o[x],P());el.value=v;}if(el.dataset&&el.dataset.k==='inf'&&G){P().inf=el.value;updateSpend();}if(el.id==='smonth')SETUP.startMonth=+el.value;});
function updateSpend(){const b=document.querySelector('#spend b');if(b)b.textContent=fmt(plannedSpend().total)+' ฿';}
renderSetup();
