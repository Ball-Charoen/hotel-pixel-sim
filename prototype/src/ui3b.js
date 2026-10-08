/* ---------- setup ---------- */
function renderSetup(){
  const maps=Object.entries(MAPS).map(([k,m])=>`<button type="button" data-set="map" data-v="${k}" aria-pressed="${SETUP.map===k}">${m.name}</button>`).join('');
  const cities=MAPS[SETUP.map].cities.map(id=>`<button type="button" data-set="city" data-v="${id}" aria-pressed="${SETUP.city===id}">${CITIES[id].name}</button>`).join('');
  const ch=Object.entries(CHAOS).map(([k,c])=>`<button type="button" data-set="chaos" data-v="${k}" aria-pressed="${SETUP.chaos===k}">${c.name}</button>`).join('');
  const months=TH_MONTH_FULL.map((m,i)=>`<option value="${i}" ${SETUP.startMonth===i?'selected':''}>${m}</option>`).join('');
  $('#app').innerHTML=`<div class="panel"><h1>เครื่องจำลองเศรษฐกิจโรงแรม (ต้นแบบ P0 v0.3)</h1>
  <p class="muted">บริหารโฮสเทล 8 ห้อง 12 สัปดาห์ แข่งกับโรงแรมบอท 3 แห่งในเมืองเดียวกัน เลือกเมืองจากแผนที่หรือปุ่มด้านขวา</p>
  <div class="setup2"><div>${mapSVG(SETUP.city)}<p class="note" style="text-align:center">แผนที่พิกเซลจากเส้นเขตแดนจริง (${src('ne','Natural Earth')})</p></div>
  <div><fieldset><legend>ประเภทแมพ</legend><div class="seg">${maps}</div></fieldset>
  <fieldset><legend>เมือง</legend><div class="seg">${cities}</div></fieldset>
  ${cityCard(SETUP.city)}
  <fieldset style="margin-top:12px"><legend>ชื่อโรงแรมของคุณ</legend><input type="text" id="hname" maxlength="30" value="${esc($('#hname')?$('#hname').value:'โฮสเทลของฉัน')}"></fieldset>
  <h3>ตั้งค่าห้องเรียน (สำหรับผู้สอน)</h3>
  <fieldset><legend>เริ่มเกมเดือน</legend><select id="smonth">${months}</select><p class="small muted">12 สัปดาห์ ≈ 3 เดือน เลือกเดือนเพื่อกำหนดว่าเกมจะอยู่ในไฮซีซั่นหรือโลว์ซีซั่นของเมืองนี้</p></fieldset>
  <fieldset><legend>ระดับเหตุการณ์สุ่ม</legend><div class="seg">${ch}</div></fieldset>
  <fieldset><label class="row" style="justify-content:flex-start"><input type="checkbox" id="allowfake" ${SETUP.allowFake?'checked':''}> เปิดให้ใช้กลยุทธ์รีวิวปลอม (มีความเสี่ยงถูกจับ)</label></fieldset>
  <fieldset><legend>รหัสเกม (seed)</legend><input type="text" id="seed" value="${esc($('#seed')?$('#seed').value:'class-'+Math.floor(Math.random()*9000+1000))}" maxlength="24"><p class="small muted">ใช้รหัสเดียวกันทั้งห้อง ทุกคนจะได้บอท ปฏิทินอีเวนต์ และเหตุการณ์สุ่มชุดเดียวกัน</p></fieldset>
  <button class="btn" id="start" type="button">เริ่มสัปดาห์แรก</button></div></div></div>`;}
/* ---------- game shell ---------- */
function weekCtx(w){const wi=weekInfo(G,Math.min(w,WEEKS-1));const s=seasonMult(G,Math.min(w,WEEKS-1));return {wi,tmd:tmdSeason(wi.month,wi.day),lab:seasonLabel(s),s};}
function topbar(){const h=P();const x=weekCtx(G.week);const teamSat=h.staff.length?h.staff.reduce((a,s)=>a+s.sat,0)/h.staff.length:0;
  return `<div class="topbar"><div class="stat"><span class="k">สัปดาห์</span><span class="v">${Math.min(G.week+1,WEEKS)}/${WEEKS}</span></div>
  <div class="stat"><span class="k">${CITIES[G.city].name}</span><span style="font-size:.95rem">${x.wi.label}</span><br><span class="chip ${x.tmd}">${TMD_NAME[x.tmd]}</span><span class="chip ${x.lab}">${SEASON_NAME[x.lab]}</span></div>
  <div class="stat"><span class="k">เงินสด (บาท)</span><span class="v ${h.cash<0?'down':''}">${fmt(h.cash)}</span></div>
  <div class="stat"><span class="k">ดาวรีวิว</span><span class="v">${h.R.toFixed(2)}</span></div>
  <div class="stat"><span class="k">ความพึงพอใจพนักงาน</span><span class="v">${h.staff.length?Math.round(teamSat):'–'}</span></div>
  <button type="button" class="infobtn" data-act="info" aria-label="ข้อมูลเหตุการณ์และวิธีสุ่ม" title="ข้อมูลเหตุการณ์และวิธีสุ่ม">i</button></div>`;}
const TABS=[['market','ตลาดและปฏิทิน'],['decide','ตัดสินใจ'],['staff','พนักงาน'],['customer','ลูกค้า'],['report','รายงานผล']];
let INFO_OPEN=false;
function infoModal(){return `<div class="overlay" data-overlay="1"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="infotitle"><div class="modal-head"><h2 id="infotitle">ข้อมูล: คลังเหตุการณ์และวิธีสุ่ม</h2><button type="button" class="btn ghost" data-act="closeinfo" aria-label="ปิดหน้าต่างข้อมูล">ปิด ✕</button></div><div class="modal-body">${tabEvents()}</div></div></div>`;}
function renderGame(){
  const tabs=`<div class="tabs" role="tablist">${TABS.map(([k,n])=>`<button type="button" role="tab" data-tab="${k}" aria-selected="${TAB===k}">${n}</button>`).join('')}</div>`;
  const body={market:tabMarket,decide:tabDecide,staff:tabStaff,customer:tabCustomer,report:tabReport}[TAB]();
  $('#app').innerHTML=topbar()+tabs+`<div id="tabbody">${body}</div>`+endBar()+(INFO_OPEN?infoModal():'');
  document.body.style.overflow=INFO_OPEN?'hidden':'';}
function plannedSpend(){const h=P();const sal=h.staff.reduce((a,s)=>a+s.salary,0);return {sal,total:sal+h.bonus+h.mk.billboard+h.mk.online+(h.inf!=='none'?INFLUENCER[h.inf].cost:0)+(h.fake?COST.fake:0)+COST.fixed};}
function endBar(){const h=P();if(G.week>=WEEKS)return `<div class="endbar"><button class="btn" data-act="final" type="button">ดูผลสรุป 12 สัปดาห์</button></div>`;
  const sp=plannedSpend();return `<div class="endbar"><p class="small" id="spend" style="margin:0 0 6px">รายจ่ายที่แน่นอนสัปดาห์นี้ ≈ <b>${fmt(sp.total)} ฿</b> <span class="muted">(ยังไม่รวมต้นทุนต่อห้อง-คืนและค่าคอมมิชชัน)</span></p>
  <button class="btn" id="endweek" type="button" ${h.staff.length?'':'disabled'}>${h.staff.length?`จบสัปดาห์ที่ ${G.week+1}`:'จ้างพนักงานอย่างน้อย 1 คนก่อน (แท็บพนักงาน)'}</button></div>`;}
/* ---------- market tab ---------- */
function seasonBand(){let wk='',tour='',tmd='',ev='';for(let w=0;w<WEEKS;w++){const x=weekCtx(w);const cur=w===G.week?' cur':'';const sch=G.timeline[w].scheduled;
  wk+=`<div class="cell ev${cur}"><b>ส.${w+1}</b><br>${x.wi.label}</div>`;
  tour+=`<div class="cell ${x.lab}${cur}">${SEASON_NAME[x.lab]}</div>`;
  tmd+=`<div class="cell ${x.tmd}${cur}">${TMD_NAME[x.tmd]}</div>`;
  ev+=`<div class="cell ev${cur}">${sch.length?sch.map(e=>'★ '+e.name).join('<br>'):'–'}</div>`;}
  return `<div class="bandwrap"><div class="band2"><div class="lab">สัปดาห์</div>${wk}<div class="lab">ฤดูท่องเที่ยว</div>${tour}<div class="lab">ฤดูกาลไทย</div>${tmd}<div class="lab">อีเวนต์</div>${ev}</div></div>
  <div class="bandlegend"><span class="chip high">ไฮซีซั่น</span><span class="chip shoulder">กึ่งไฮซีซั่น</span><span class="chip low">โลว์ซีซั่น</span><span class="chip summer">ฤดูร้อน</span><span class="chip rainy">ฤดูฝน</span><span class="chip winter">ฤดูหนาว</span></div>`;}
function calendarTable(){let rows='';for(let w=0;w<WEEKS;w++){const x=weekCtx(w);const t=G.timeline[w];const past=w<G.week;
  const sch=t.scheduled.map(e=>`<b>${e.name}</b>${e.kind==='national'?' (เทศกาลประจำปี)':' (ประกาศล่วงหน้า)'}<br><span class="small muted">${schedText(e)}</span>${past&&e.cancelled?'<br><span class="down">ถูกยกเลิก</span>':''}`).join('<br>')||'<span class="muted">–</span>';
  const sh=past?(t.shocks.length?t.shocks.map(s=>`${s.ev.positive?'▲':'▼'} ${s.ev.name} <span class="small muted">(${phaseName(s.k,s.d,s.perm)})</span>`).join('<br>'):'<span class="muted">ไม่มี</span>'):(REVEAL?t.shocks.map(s=>`<span class="muted">${s.ev.name}</span>`).join('<br>')||'–':'<span class="muted">?</span>');
  rows+=`<tr class="${w===G.week?'now':''}"><td>ส.${w+1}<br><span class="small muted">${x.wi.label}</span></td><td><span class="chip ${x.lab}">${SEASON_NAME[x.lab]}</span><br><span class="chip ${x.tmd}">${TMD_NAME[x.tmd]}</span></td><td>${sch}</td><td>${sh}</td></tr>`;}
  return `<div class="tablewrap"><table class="cal"><thead><tr><th>สัปดาห์</th><th>ฤดู</th><th>อีเวนต์ที่รู้ล่วงหน้า</th><th>เหตุการณ์ฉุกเฉิน</th></tr></thead><tbody>${rows}</tbody></table></div>`;}
function tabMarket(){const news=G.news.slice(-8).reverse();
  return `<div class="two"><div class="panel">${cityCard(G.city)}</div><div class="panel"><h2>ข่าวในตลาด</h2>${news.length?`<ul class="list">${news.map(n=>`<li>ส.${n.week}: ${esc(n.text)}</li>`).join('')}</ul>`:'<p class="muted small">ยังไม่มีข่าว ข่าวปัญหาของโรงแรมคู่แข่งจะแสดงที่นี่</p>'}</div></div>
  <div class="panel"><h2>ฤดูกาล 12 สัปดาห์ของเกมนี้</h2>${seasonBand()}</div>
  <div class="panel"><h2>ปฏิทินอีเวนต์</h2><p class="small">อีเวนต์ที่มีกำหนดการ (เทศกาล คอนเสิร์ต งานประชุม) ประกาศล่วงหน้า ใช้วางแผนราคาได้ ส่วนเหตุการณ์ฉุกเฉิน (สภาพอากาศ ภัยพิบัติ การเมือง) รู้หลังเกิดเท่านั้น อีเวนต์ที่ประกาศแล้วมีโอกาสถูกยกเลิก ${Math.round(CANCEL_P*100)}%</p>${calendarTable()}</div>`;}
/* ---------- decide tab ---------- */
function segmentTable(){const c=CITIES[G.city];const tot=SEGMENTS.reduce((a,s)=>a+c.demand[s.id],0);
  return `<div class="tablewrap"><table class="compact"><thead><tr><th>กลุ่มลูกค้า</th><th>งบต่อคืน (บาท)</th><th>สัดส่วนดีมานด์</th><th>ในกลุ่มนี้เป็นต่างชาติ</th><th>วันที่มักพัก</th></tr></thead><tbody>
  ${SEGMENTS.map(s=>`<tr><td><span style="color:${SEG_COLOR[s.id]}">■</span> <b>${s.name}</b><span class="focus">ให้น้ำหนัก: ${SEG_FOCUS[s.id]}</span></td><td>≈ ${fmt(s.wtp)}</td><td>${Math.round(c.demand[s.id]/tot*100)}%</td><td>${Math.round(clamp(c.foreign*s.fb,0,.95)*100)}%</td><td>${s.wdShare>.6?'วันธรรมดา':s.wdShare<.4?'สุดสัปดาห์':'ทั้งสองช่วง'}</td></tr>`).join('')}
  </tbody></table></div><p class="note">งบต่อคืนคือราคาที่ลูกค้ากลุ่มนั้นยินดีจ่ายโดยเฉลี่ย ตั้งราคาสูงกว่านี้มาก ลูกค้ากลุ่มนั้นจะเลือกที่อื่น และจะคาดหวังบริการสูงขึ้นตามราคา</p>`;}
function weekBox(){const x=weekCtx(G.week);const t=G.timeline[G.week];const next=G.week+1<WEEKS?G.timeline[G.week+1]:null;
  const ev=t.scheduled.map(e=>`<li><b>${e.name}</b>: ${schedText(e)}</li>`).join('');const nx=next?next.scheduled.map(e=>`<li>สัปดาห์หน้า: ${e.name}</li>`).join(''):'';
  return `<div class="weekbox"><b>สัปดาห์นี้ (${x.wi.label})</b> <span class="chip ${x.tmd}">${TMD_NAME[x.tmd]}</span><span class="chip ${x.lab}">${SEASON_NAME[x.lab]}</span> ดีมานด์ตามฤดู ×${x.s.toFixed(2)}
  ${ev||nx?`<ul class="list" style="margin-top:6px">${ev}${nx}</ul>`:'<p class="small muted" style="margin:4px 0 0">ไม่มีอีเวนต์ที่ประกาศล่วงหน้า เหตุการณ์ฉุกเฉินจะรู้หลังจบสัปดาห์</p>'}</div>`;}
function rangeCtl(k,label,val,min,max,step,big,sub){const p=((val-min)/(max-min)*100).toFixed(1);const isPrice=k.startsWith('price');
  return `<div class="ctl"><label class="row"><span>${label}${sub?`<br><span class="small muted">${sub}</span>`:''}</span>${isPrice?`<input type="number" class="num" min="${min}" max="${max}" step="${step}" value="${val}" data-k="${k}" aria-label="${label}">`:`<b data-show="${k}">${fmt(val)} ฿</b>`}</label>
  <div class="rangerow"><button type="button" class="stepbtn" data-step="${k}:${-big}" aria-label="ลด ${big} บาท">−</button><input type="range" min="${min}" max="${max}" step="${step}" value="${val}" data-k="${k}" aria-label="${label}" style="--p:${p}%"><button type="button" class="stepbtn" data-step="${k}:${big}" aria-label="เพิ่ม ${big} บาท">+</button></div></div>`;}
function tabDecide(){const h=P();
  const inf=Object.entries(INFLUENCER).map(([k,v])=>`<option value="${k}" ${h.inf===k?'selected':''}>${v.name}${v.cost?` – ${fmt(v.cost)} ฿`:''}</option>`).join('');
  if(G.week>=WEEKS)return `<div class="panel"><h2>ครบ 12 สัปดาห์แล้ว</h2><p>อ่านรายงานสัปดาห์สุดท้าย แล้วกดดูผลสรุปด้านล่าง</p></div>`;
  return `<div class="panel"><h2>การตัดสินใจสัปดาห์ที่ ${G.week+1}</h2>${weekBox()}<h3>รู้จักลูกค้าใน${CITIES[G.city].name}</h3>${segmentTable()}</div>
  <div class="two"><div class="panel"><h3 style="margin-top:0">ราคาห้องต่อคืน</h3>
   ${rangeCtl('price.wd','วันธรรมดา (อา–พฤ, 5 คืน)',h.price.wd,200,4000,10,50)}
   ${rangeCtl('price.we','ศุกร์–เสาร์ (2 คืน)',h.price.we,200,4000,10,50)}
   <p class="note">ปุ่ม − / + ปรับครั้งละ 50 บาท หรือคลิกแถบแล้วใช้ปุ่มลูกศรบนคีย์บอร์ดปรับทีละ 10 บาท ราคาเฉลี่ยตามดีมานด์ของเมืองนี้ ≈ ${fmt(G.refP)} บาท</p>
   <p class="small">ทีมตอนนี้: ${h.staff.length} คน · เงินเดือนรวม ${fmt(plannedSpend().sal)} ฿/สัปดาห์ <button class="btn ghost" type="button" data-tab="staff" style="padding:2px 10px;box-shadow:none">ไปแท็บพนักงาน</button></p>
   ${h.closed?`<div class="warn">ปิดซ่อม ${h.closed} ห้อง อีก ${h.closedWeeks} สัปดาห์</div>`:''}</div>
  <div class="panel"><h3 style="margin-top:0">การตลาด</h3>
   ${rangeCtl('mk.billboard','ป้ายโฆษณา',h.mk.billboard,0,4000,100,100,'ผลค่อยๆ ขึ้น อยู่นาน')}
   ${rangeCtl('mk.online','โฆษณาออนไลน์',h.mk.online,0,4000,100,100,'ผลเร็ว หยุดจ่ายแล้วหายเร็ว')}
   <label class="row"><span>อินฟลูเอนเซอร์ (สัปดาห์นี้)</span><select data-k="inf">${inf}</select></label>
   <p class="note">ผลของอินฟลูเอนเซอร์ไม่แน่นอน ถ้าบริการจริงแย่ ชื่อเสียงจะลดลง</p>
   <label class="row" style="justify-content:flex-start"><input type="checkbox" data-k="ota" ${h.ota?'checked':''} ${h.otaBan>0?'disabled':''}> ขายผ่าน OTA (คนเห็นมากขึ้น เสียค่าคอมมิชชัน ${OTA_COMMISSION*100}% ของยอดจองผ่าน OTA)</label>
   ${h.otaBan>0?`<div class="warn">ถูกระงับจาก OTA อีก ${h.otaBan} สัปดาห์ เพราะตรวจพบรีวิวปลอม</div>`:''}
   ${G.allowFake?`<label class="row" style="justify-content:flex-start"><input type="checkbox" data-k="fake" ${h.fake?'checked':''}> ซื้อรีวิวปลอม (${fmt(COST.fake)} ฿/สัปดาห์)</label>
   <p class="note">ดาวขึ้นเร็ว แต่มีโอกาสถูกจับทุกสัปดาห์: ปรับ ${fmt(COST.fine)} ฿ ดาวลด และถูกระงับจาก OTA 3 สัปดาห์ ในโลกจริง ${src('ftc','กฎของ FTC สหรัฐฯ (2024)')} ห้ามซื้อขายรีวิวปลอม</p>`:''}</div></div>`;}
/* ---------- staff tab ---------- */
function hbar(label,v,mark,max=100,right){return `<div class="hbar"><span>${label}</span><span class="track"><b style="width:${clamp(v/max*100,0,100)}%"></b>${mark!=null?`<i style="left:${clamp(mark/max*100,0,100)}%"></i>`:''}</span><span>${right!=null?right:Math.round(v)}</span></div>`;}
function staffCard(c,hired){const bars=['app','serv','exp','prof','lang'].map(k=>`<div class="bar"><span>${STAT[k]}</span><i><b style="width:${c[k]}%"></b></i><span>${c[k]}</span></div>`).join('');const h=P();
  return `<div class="card${hired?' hired':''}"><div class="head">${avatarSVG(c.look,c.name)}<div class="nm" style="flex:1"><span>${c.name}</span><span class="small">${fmt(c.salary)} ฿/สัปดาห์</span></div></div>${bars}
  ${hired?`<div class="small">ความพึงพอใจ</div><div class="meter"><b style="width:${Math.round(c.sat)}%;background:${c.sat<40?'var(--chili)':'var(--jade)'}"></b></div>`:''}
  ${G.week<WEEKS?`<button type="button" class="btn ${hired?'ghost':''}" data-staff="${c.id}" ${!hired&&h.staff.length>=4?'disabled':''}>${hired?'ให้ออก (ชดเชย 1 สัปดาห์)':'จ้าง'}</button>`:''}</div>`;}
function tabStaff(){const h=P();const last=h.history[h.history.length-1];const hiredIds=new Set(h.staff.map(s=>s.id));
  const team={};['app','serv','exp','prof','lang'].forEach(k=>team[k]=h.staff.length?h.staff.reduce((a,s)=>a+s[k],0)/h.staff.length:0);
  const bots=G.hotels.filter(x=>!x.isPlayer);const comp={};['app','serv','exp','prof','lang'].forEach(k=>comp[k]=bots.reduce((a,b)=>a+b.staff.reduce((x,s)=>x+s[k],0)/Math.max(1,b.staff.length),0)/bots.length);
  const qChart=LOG.length?lineChart([{name:'คุณภาพที่ส่งมอบ (ทีมคุณ)',color:'var(--jade)',values:LOG.map(r=>r.Q)},{name:'ความคาดหวังของแขก',color:'var(--chili)',values:LOG.map(r=>r.E)},{name:'คู่แข่งเฉลี่ย (ส่งมอบ)',color:'var(--muted)',values:LOG.map(r=>r.cQ)}],LOG.map(r=>'ส.'+r.week),{aria:'คุณภาพบริการรายสัปดาห์',min:0}):'<p class="muted small">กราฟจะแสดงหลังจบสัปดาห์แรก</p>';
  return `<div class="two"><div class="panel"><h2>คุณภาพบริการของทีม</h2>
  <p class="small">ค่าเฉลี่ยของทีมคุณ (แถบสี) เทียบค่าเฉลี่ยทีมคู่แข่ง (เส้นดำ) แต่ละสเตตัสแมปกับมิติของ ${src('servqual','SERVQUAL')}</p>
  ${['app','serv','exp','prof','lang'].map(k=>hbar(`${STAT[k]}<br><span class="small muted">${SQ[k]}</span>`,team[k],comp[k])).join('')}
  ${last?`<h3>สัปดาห์ที่แล้ว</h3>${hbar('คุณภาพที่ส่งมอบ',last.Q,last.E,100,`${Math.round(last.Q)}`)}<p class="note">เส้นดำ = ความคาดหวังเฉลี่ยของแขก (${Math.round(last.E)}) ถ้าแถบสั้นกว่าเส้น รีวิวจะต่ำกว่า 3.4 ดาว</p>
   ${hbar('ความพอของพนักงาน',last.adequacy*100,null,100,pct(last.adequacy))}${hbar('ภาระงาน (ห้อง-คืน/คน)',last.load,15,30,Math.round(last.load))}<p class="note">เกิน 15 ห้อง-คืนต่อคนต่อสัปดาห์ ความพึงพอใจพนักงานจะลดลง</p>`:''}
  <h3>คุณภาพบริการรายสัปดาห์</h3><div class="chart">${qChart}</div>
  ${G.week<WEEKS?rangeCtl('bonus','โบนัสพนักงานรวมต่อสัปดาห์',h.bonus,0,4000,100,100):''}</div>
  <div class="panel"><h2>ทีมของคุณ (${h.staff.length}/4)</h2><div class="staff">${h.staff.map(s=>staffCard(s,true)).join('')||'<p class="muted">ยังไม่มีพนักงาน</p>'}</div>
  <h3>ผู้สมัคร</h3><div class="staff">${G.candidates.filter(c=>!c.gone&&!hiredIds.has(c.id)).map(c=>staffCard(c,false)).join('')}</div>
  <p class="note">ภาพตัวละครเป็นภาพชั่วคราวที่สร้างจากรหัส รอแทนด้วยดีไซน์จริง</p></div></div>`;}
