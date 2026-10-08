const $=s=>document.querySelector(s);
const fmt=n=>Math.round(n).toLocaleString('th-TH');
const pct=x=>(x*100).toFixed(1)+'%';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STAT={app:'รูปลักษณ์',serv:'จิตใจบริการ',exp:'ประสบการณ์',prof:'ความเป็นมืออาชีพ',lang:'ภาษาต่างประเทศ'};
const SQ={app:'Tangibles',serv:'Empathy + Responsiveness',exp:'Reliability',prof:'Assurance',lang:'สื่อสารกับแขกต่างชาติ'};
const SEG_FOCUS={bp:'จิตใจบริการ',fam:'จิตใจบริการ',cpl:'รูปลักษณ์ + จิตใจบริการ',biz:'ความเป็นมืออาชีพ'};
const SEG_COLOR={bp:'#E0A23A',fam:'#3E8E7E',cpl:'#C8577A',biz:'#4F6FB0'};
const PAL={y:'#E8B730',w:'#F4EFE2',k:'#3A3A44',t:'#8C5A3C',b:'#3E8DB5',c:'#E8F0F2',g:'#6BA55A',G:'#A8D58A',d:'#3F7A4A',m:'#7D8FA0',r:'#C0473A',o:'#B5643C',p:'#C8577A'};
const SRC={
 str:'https://str.com/resourcesglossary/revpar-indexrevenue-generating-index-rgi',ehl:'https://insights.ehl.edu/hotel-industry-performance',ehl2:'https://insights.ehl.edu/what-is-revpar',
 chekin:'https://chekin.com/en/blog/str-report-for-hotels/',rpgRev:'https://roompricegenie.com/revenue-per-available-room-revpar',rpgAdr:'https://roompricegenie.com/glossary/average-daily-rate-adr',
 axis:'https://blog.axisrooms.com/revenue-management-glossary/',akia:'https://www.akia.com/glossary/r',raft:'https://www.raftlabs.com/tools/revpar-calculator',
 crookall:'https://ideas.repec.org/a/sae/simgam/v41y2010i6p898-920.html',ftc:'https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials',
 nso:'https://www.nso.go.th/nsoweb/downloadFile/stat_main_nso/FgpN/file_th',servqual:'https://en.wikipedia.org/wiki/SERVQUAL',
 tmd:'https://www.nso.go.th/public/e-book/Statistical-Yearbook/SYB-2023/621/',phuket:'https://www.phuketferry.com/th/the-weather-and-climate-of-phuket.html',
 phuket2:'https://www.nomadotravel.app/th/guides/best-time-to-visit-phuket',ranong:'https://www.silpa-mag.com/history/article_159902',festival:'https://www.byklo.rent/th/blog/when-to-visit-phuket-weather/',
 litvin:'https://pure.psu.edu/en/publications/electronic-word-of-mouth-in-hospitality-and-tourism-management/',faulkner:'https://1library.net/article/key-terms-discussion-assessment-literature.yexrev0q',
 faulknerPhases:'https://dspace.angliss.edu.au/handle/20.500.12270/350',ne:'https://github.com/nvkelso/natural-earth-vector'
};
const src=(k,t)=>`<a href="${SRC[k]}" target="_blank" rel="noopener">${t}</a>`;
const PROMPTS=['สัปดาห์นี้อะไรกำหนดยอดขายของคุณมากที่สุด ระหว่างราคา ชื่อเสียง และการรับรู้ของลูกค้า?','MPI กับ ARI ของคุณบอกอะไรเกี่ยวกับกลยุทธ์ราคาของคุณ?','เหตุการณ์สัปดาห์นี้กระทบทุกโรงแรมเท่ากัน ทำไมบางโรงแรมยังทำ RGI ได้ดีกว่า?','พนักงานของคุณรับภาระงานไหวไหม และส่งผลต่อคะแนนรีวิวอย่างไร?','เซกเมนต์ไหนพักกับคุณมากที่สุด ตรงกับกลยุทธ์ที่ตั้งใจไว้ไหม?','ถ้าย้อนกลับไปต้นสัปดาห์ได้ คุณจะเปลี่ยนการตัดสินใจข้อไหน และคาดว่าตัวชี้วัดไหนจะเปลี่ยน?','คุณใช้ปฏิทินอีเวนต์ตั้งราคาล่วงหน้าแล้วหรือยัง ได้ผลอย่างไร?','งบการตลาดสัปดาห์นี้คุ้มไหม ดูจากการรับรู้และ RevPAR ที่เพิ่มขึ้น'];
let G=null,LAST=null,LOG=[],TAB='decide',REVEAL=false,SETUP={map:'town',city:'pbi',chaos:'mid',allowFake:true,startMonth:10};
const P=()=>G.hotels[0];
const phaseName=(k,d,perm)=>perm?'ถาวร':d<=1?'ฉุกเฉิน':k===0?'ฉุกเฉิน':k===d-1?'ฟื้นตัว':'ช่วงกลาง';
function effText(f){const out=[];const pc=m=>(m>1?'+':'−')+Math.round(Math.abs(m-1)*100)+'%';
  if(f.all)out.push('ดีมานด์ทุกกลุ่ม '+pc(f.all));SEGMENTS.forEach(s=>{if(f[s.id])out.push(s.name+' '+pc(f[s.id]));});
  if(f.foreign)out.push('ต่างชาติ '+pc(f.foreign));if(f.domestic)out.push('คนไทย '+pc(f.domestic));if(f.cost)out.push('ต้นทุนคงที่ '+pc(f.cost));
  if(f.A0)out.push('ทางเลือกนอกเกม '+pc(f.A0));if(f.wtp)out.push('งบต่อคืนของลูกค้า '+pc(f.wtp));if(f.staffHit)out.push('ความพึงพอใจพนักงาน −'+f.staffHit);return out.join(', ');}
function schedText(e){const f={};if(e.mult)Object.assign(f,e.mult);if(e.foreign)f.foreign=e.foreign;return effText(f);}

/* ---------- pixel art ---------- */
function pixelSVG(rows,label){let r='';rows.forEach((row,y)=>{let x=0;while(x<row.length){const ch=row[x];let n=1;while(x+n<row.length&&row[x+n]===ch)n++;if(ch!=='.')r+=`<rect x="${x}" y="${y}" width="${n}" height="1" fill="${PAL[ch]}"/>`;x+=n;}});
  return `<svg viewBox="0 0 20 16" class="lm" role="img" aria-label="${esc(label)}" shape-rendering="crispEdges"><rect width="20" height="16" fill="#BFE0EA"/>${r}</svg>`;}
function avatarSVG(look,label){const rng=mulberry32(look||1);const skins=['#F1C9A5','#E0AC82','#C68B5E','#9A6644'];const hairs=['#2B2222','#4A3426','#7A4E2D','#1E2430','#B6542F'];const unis=['#1F7A65','#4F6FB0','#C8577A','#B5643C','#3E8E7E'];
  const sk=skins[Math.floor(rng()*4)],hr=hairs[Math.floor(rng()*5)],un=unis[Math.floor(rng()*5)],style=Math.floor(rng()*3);let r='';const px=(x,y,c,w=1,h=1)=>r+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
  px(3,2,hr,6,2);px(2,3,hr,1,style===1?6:3);px(9,3,hr,1,style===1?6:3);if(style===2)px(5,0,hr,2,2);
  px(3,4,sk,6,4);px(4,5,'#1D2B34');px(7,5,'#1D2B34');px(5,7,'#B05A4A',2,1);px(3,8,sk,6,1);
  px(2,9,un,8,3);px(5,9,'#F4EFE2',2,1);px(5,10,'#F2B33D',2,1);
  return `<svg viewBox="0 0 12 12" class="avatar" role="img" aria-label="${esc(label)}" shape-rendering="crispEdges">${r}</svg>`;}
function mapSVG(sel){const M=THMAP;let r='';M.rows.forEach((row,y)=>{let x=0;while(x<row.length){const ch=row[x];let n=1;while(x+n<row.length&&row[x+n]===ch)n++;if(ch!=='.')r+=`<rect x="${x}" y="${y}" width="${n}" height="1" fill="${ch==='T'?'var(--land)':'var(--nb)'}"/>`;x+=n;}});
  const pins=Object.entries(CITIES).map(([id,c])=>{const x=(c.lon-M.lon0)/M.step,y=(M.lat1-c.lat)/M.step;const on=id===sel;
    return `<g data-city="${id}" tabindex="0" role="button" aria-label="${c.name}" aria-pressed="${on}"><rect class="pin" x="${(x-1).toFixed(1)}" y="${(y-1).toFixed(1)}" width="2" height="2" fill="${on?'var(--lamp)':'var(--pin)'}" stroke="var(--line)" stroke-width=".4"/>${on?`<text x="${(x+1.8).toFixed(1)}" y="${(y+.9).toFixed(1)}" font-size="2.6" font-weight="700" fill="var(--ink)" stroke="var(--surface)" stroke-width=".5" paint-order="stroke">${c.name}</text>`:''}</g>`;}).join('');
  return `<svg viewBox="0 0 ${M.W} ${M.H}" class="thmap" role="img" aria-label="แผนที่ประเทศไทยแบบพิกเซล" shape-rendering="crispEdges"><rect width="${M.W}" height="${M.H}" fill="var(--sea)"/>${r}${pins}</svg>`;}
function buildingSVG(occ,closed){const lit=Math.round(clamp(occ||0,0,1)*8);let w='',k=0;
  for(const y of [36,70])for(const x of [20,52,84,116]){const isClosed=closed&&k>=8-closed;const on=!isClosed&&k<lit;w+=`<rect x="${x}" y="${y}" width="22" height="20" class="win${on?' on':''}"/>`;if(on)w+=`<rect x="${x+2}" y="${y+2}" width="5" height="5" class="glint"/>`;if(isClosed)w+=`<rect x="${x}" y="${y+8}" width="22" height="4" fill="#C0473A"/>`;k++;}
  const stars=[[14,10],[40,6],[118,8],[140,18],[96,4],[24,22]].map(([x,y])=>`<rect x="${x}" y="${y}" width="2" height="2" class="star"/>`).join('');
  return `<svg viewBox="0 0 154 150" class="bld" role="img" aria-label="ภาพตัดตึกโฮสเทล ไฟเปิด ${lit} จาก 8 ห้อง" shape-rendering="crispEdges"><rect x="0" y="0" width="154" height="150" class="sky"/>${stars}<rect x="0" y="138" width="154" height="12" class="ground"/>
  <rect x="6" y="24" width="142" height="8" class="roof"/><rect x="18" y="16" width="118" height="8" class="roof"/><rect x="34" y="8" width="86" height="8" class="roof"/><rect x="10" y="32" width="134" height="106" class="wall"/>
  <rect x="10" y="62" width="134" height="4" class="beam"/><rect x="10" y="96" width="134" height="4" class="beam"/>${w}
  <rect x="16" y="106" width="64" height="16" class="sign"/><text x="48" y="118" text-anchor="middle" class="signtxt">HOSTEL</text><rect x="98" y="106" width="30" height="32" class="door"/><rect x="122" y="120" width="3" height="3" class="glint"/></svg>`;}
function monthBars(city){const a=CITIES[city].monthly;const mx=Math.max(...a);
  return `<div class="mbars" aria-label="ดีมานด์รายเดือน">${a.map((v,i)=>`<span class="" style="height:${Math.round(v/mx*100)}%;background:var(--${seasonLabel(v)==='high'?'hi':seasonLabel(v)==='low'?'lo':'sh'})" title="${TH_MONTH[i]} ${SEASON_NAME[seasonLabel(v)]}"></span>`).join('')}</div><div class="mlabels">${TH_MONTH.map(m=>`<span>${m}</span>`).join('')}</div>
  <p class="small muted"><span class="chip high">ไฮซีซั่น</span><span class="chip shoulder">กึ่งไฮซีซั่น</span><span class="chip low">โลว์ซีซั่น</span></p>`;}
function cityCard(id){const c=CITIES[id];const tot=SEGMENTS.reduce((a,s)=>a+c.demand[s.id],0);
  return `<div class="citycard">${pixelSVG(LANDMARK[id],c.lm)}<div><h2 style="margin-bottom:2px">${c.name}</h2><p class="small muted" style="margin-bottom:6px">${MAPS[c.map].name} · ภาพประกอบ: ${c.lm}</p><p>${c.story}</p>
  <p class="small">ต่างชาติราว ${Math.round(c.foreign*100)}% · ลูกค้าหลัก: ${SEGMENTS.slice().sort((a,b)=>c.demand[b.id]-c.demand[a.id]).slice(0,2).map(s=>s.name+' '+Math.round(c.demand[s.id]/tot*100)+'%').join(', ')}</p></div></div>
  <h3>ฤดูท่องเที่ยวรายเดือนของ${c.name}</h3>${monthBars(id)}`;}
