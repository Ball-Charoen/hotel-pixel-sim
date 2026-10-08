function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hashSeed(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return h>>>0;}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const r100=x=>Math.round(x/100)*100, r10=x=>Math.round(x/10)*10;
const ROOMS=8,NIGHTS={wd:5,we:2},WEEKS=12;
const TH_MONTH=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const TH_MONTH_FULL=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const SEGMENTS=[
 {id:'bp',name:'แบ็คแพ็คเกอร์',wtp:450,bp:3.0,wdShare:.70,w:{app:.15,serv:.45,exp:.25,prof:.15},fb:1.3},
 {id:'fam',name:'กลุ่มครอบครัว',wtp:900,bp:2.2,wdShare:.35,w:{app:.2,serv:.4,exp:.25,prof:.15},fb:0.3},
 {id:'cpl',name:'คู่รัก',wtp:1300,bp:1.6,wdShare:.45,w:{app:.35,serv:.35,exp:.15,prof:.15},fb:1.0},
 {id:'biz',name:'นักธุรกิจ',wtp:1700,bp:1.2,wdShare:.9,w:{app:.2,serv:.2,exp:.25,prof:.35},fb:0.8}
];
const MAPS={
 city:{name:'เมืองใหญ่',cities:['bkk','kkn']},
 sea:{name:'ทะเลและเกาะท่องเที่ยว',cities:['hkt','pty']},
 town:{name:'เมืองรอง',cities:['pbi','rbr','rng']},
 mountain:{name:'เมืองภูเขา',cities:['cnx','pnb']}
};
const CITIES={
 bkk:{name:'กรุงเทพฯ',map:'city',lat:13.75,lon:100.50,flood:true,quake:false,coast:false,andaman:false,haze:true,mice:2,protest:2,lm:'วัดริมแม่น้ำเจ้าพระยา',
  story:'เมืองหลวงที่ไม่เคยหลับ นักธุรกิจและแบ็คแพ็คเกอร์ต่างชาติหมุนเวียนตลอดปี แต่ที่พักเปิดใหม่ทุกซอย คู่แข่งจึงหนาแน่น',
  demand:{bp:90,fam:35,cpl:50,biz:110},foreign:.55,monthly:[1.12,1.08,1.0,1.02,0.92,0.88,0.9,0.92,0.86,0.94,1.08,1.18]},
 kkn:{name:'ขอนแก่น',map:'city',lat:16.43,lon:102.83,flood:true,quake:false,coast:false,andaman:false,haze:true,mice:2,protest:.5,lm:'พระมหาธาตุแก่นนคร',
  story:'ศูนย์กลางภาคอีสาน งานประชุมและนักธุรกิจคือลูกค้าหลัก ต่างชาติไม่มาก แต่วันธรรมดาคึกคัก',
  demand:{bp:30,fam:70,cpl:40,biz:125},foreign:.1,monthly:[1.05,1.0,0.95,1.1,0.9,0.92,0.95,0.95,0.92,1.0,1.08,1.15]},
 hkt:{name:'ภูเก็ต',map:'sea',lat:7.88,lon:98.39,flood:false,quake:false,coast:true,andaman:true,haze:false,mice:1,protest:.3,lm:'หาดทรายและเรือหางยาว',
  story:'ไข่มุกอันดามัน ต่างชาติสูงมาก ช่วง พ.ย.–เม.ย. คือช่วงท่องเที่ยวหลัก ส่วนมรสุมตะวันตกเฉียงใต้ทำให้ พ.ค.–ต.ค. เงียบลงชัดเจน',
  demand:{bp:140,fam:45,cpl:150,biz:12},foreign:.8,monthly:[1.28,1.3,1.2,1.08,0.8,0.68,0.75,0.75,0.65,0.78,1.05,1.3]},
 pty:{name:'พัทยา',map:'sea',lat:12.93,lon:100.88,flood:false,quake:false,coast:true,andaman:false,haze:false,mice:2,protest:.3,lm:'อ่าวพัทยา',
  story:'เมืองชายทะเลใกล้กรุงเทพฯ คนไทยเที่ยวสุดสัปดาห์ ต่างชาติมาทั้งปี และมีงานอีเวนต์กับกีฬาบ่อย',
  demand:{bp:110,fam:70,cpl:120,biz:25},foreign:.6,monthly:[1.18,1.15,1.05,1.12,0.9,0.82,0.85,0.88,0.78,0.92,1.08,1.25]},
 pbi:{name:'เพชรบุรี',map:'town',lat:13.11,lon:99.94,flood:true,quake:false,coast:true,andaman:false,haze:false,mice:0,protest:.3,lm:'พระนครคีรี (เขาวัง)',
  story:'เมืองเก่าเชิงเขาวัง ครอบครัวไทยแวะเที่ยวสุดสัปดาห์ก่อนต่อไปทะเลชะอำ ต่างชาติน้อย ราคาต้องจับต้องได้',
  demand:{bp:25,fam:130,cpl:60,biz:35},foreign:.08,monthly:[1.1,1.0,1.08,1.15,1.02,0.85,0.88,0.9,0.8,1.0,1.0,1.18]},
 rbr:{name:'ราชบุรี',map:'town',lat:13.54,lon:99.81,flood:true,quake:false,coast:false,andaman:false,haze:false,mice:0,protest:.3,lm:'ตลาดน้ำ',
  story:'เมืองตลาดน้ำและเครื่องปั้นดินเผา ครอบครัวและคู่รักไทยมักมาเช้าเย็นกลับ โรงแรมต้องหาเหตุผลให้ลูกค้าพักค้างคืน',
  demand:{bp:25,fam:110,cpl:55,biz:45},foreign:.06,monthly:[1.12,1.02,0.98,1.05,0.92,0.85,0.9,0.9,0.85,0.98,1.1,1.25]},
 rng:{name:'ระนอง',map:'town',lat:9.96,lon:98.64,flood:true,quake:false,coast:true,andaman:true,haze:false,mice:0,protest:.2,lm:'บ่อน้ำร้อนรักษะวาริน',
  story:'เมืองฝนแปดแดดสี่ บ่อน้ำร้อนและเกาะพยามดึงสายสุขภาพและแบ็คแพ็คเกอร์ แต่หน้ามรสุม พ.ค.–ต.ค. ยาวนาน',
  demand:{bp:50,fam:70,cpl:70,biz:25},foreign:.22,monthly:[1.2,1.25,1.2,1.12,0.85,0.72,0.65,0.72,0.75,0.8,1.0,1.2]},
 cnx:{name:'เชียงใหม่',map:'mountain',lat:18.79,lon:98.98,flood:true,quake:true,coast:false,andaman:false,haze:true,mice:1,protest:.3,lm:'ประตูท่าแพ',
  story:'เมืองเก่าล้านนา หน้าหนาวคึกคักที่สุดทั้งไทยและต่างชาติ นอกฤดูต้องสู้กับดีมานด์ที่หายไปเกือบครึ่ง',
  demand:{bp:110,fam:70,cpl:110,biz:25},foreign:.45,monthly:[1.35,1.15,0.9,0.95,0.78,0.72,0.82,0.85,0.8,0.95,1.25,1.45]},
 pnb:{name:'เพชรบูรณ์',map:'mountain',lat:16.42,lon:101.16,flood:true,quake:false,coast:false,andaman:false,haze:true,mice:0,protest:.2,lm:'ทะเลหมอกและไร่กะหล่ำปลี',
  story:'ทะเลหมอกเขาค้อและภูทับเบิก หน้าหนาวห้องเต็มเร็วมาก หน้าฝนเงียบเหงา เป็นเมืองที่ฤดูกาลแรงที่สุดในเกม',
  demand:{bp:20,fam:125,cpl:115,biz:15},foreign:.05,monthly:[1.45,1.05,0.8,0.9,0.7,0.65,0.75,0.75,0.75,0.95,1.35,1.6]}
};
/* ---------- calendar ---------- */
function weekStart(g,w){return new Date(Date.UTC(2027,g.startMonth,1+7*w));}
function weekInfo(g,w){const s=weekStart(g,w),e=new Date(s.getTime()+6*864e5),mid=new Date(s.getTime()+3*864e5);
  const lbl=(d)=>d.getUTCDate()+' '+TH_MONTH[d.getUTCMonth()];
  return {start:s,end:e,month:mid.getUTCMonth(),day:mid.getUTCDate(),label:s.getUTCMonth()===e.getUTCMonth()?`${s.getUTCDate()}–${e.getUTCDate()} ${TH_MONTH[e.getUTCMonth()]}`:`${lbl(s)} – ${lbl(e)}`};}
function tmdSeason(m,d){ // NSO/TMD: summer mid-Feb–mid-May, rainy mid-May–mid-Oct, winter mid-Oct–mid-Feb
  if((m===1&&d>=15)||m===2||m===3||(m===4&&d<15))return 'summer';
  if((m===4&&d>=15)||(m>=5&&m<=8)||(m===9&&d<15))return 'rainy';return 'winter';}
const TMD_NAME={summer:'ฤดูร้อน',rainy:'ฤดูฝน',winter:'ฤดูหนาว'};
function monthIdx(city,m,d){const a=CITIES[city].monthly;const f=(d-15)/30;if(f>=0)return a[m]*(1-f)+a[(m+1)%12]*f;return a[m]*(1+f)+a[(m+11)%12]*(-f);}
function seasonMult(g,w){const wi=weekInfo(g,w);return monthIdx(g.city,wi.month,wi.day);}
function seasonLabel(x){return x>=1.1?'high':x<=0.85?'low':'shoulder';}
const SEASON_NAME={high:'ไฮซีซั่น',shoulder:'กึ่งไฮซีซั่น',low:'โลว์ซีซั่น'};
/* ---------- scheduled events ---------- */
const NATIONAL=[
 {id:'songkran',name:'เทศกาลสงกรานต์',m:3,d:13,mult:{bp:1.3,fam:1.6,cpl:1.3,biz:.6},text:'13–15 เมษายน คนไทยเดินทางเที่ยวและกลับบ้านพร้อมกัน'},
 {id:'loykrathong',name:'ลอยกระทง',m:10,d:15,mult:{bp:1.15,fam:1.2,cpl:1.45,biz:.9},text:'วันเพ็ญเดือนสิบสอง ราวกลางเดือนพฤศจิกายน (วันที่เปลี่ยนทุกปี)'},
 {id:'newyear',name:'ปีใหม่',m:11,d:31,mult:{bp:1.3,fam:1.45,cpl:1.4,biz:.5},text:'ช่วงหยุดยาวสิ้นปี'},
 {id:'cny',name:'ตรุษจีน',m:1,d:5,mult:{fam:1.2,cpl:1.1},foreign:1.2,text:'ช่วงปลาย ม.ค.–ก.พ. (วันที่เปลี่ยนทุกปี) ดีมานด์โรงแรมสูงขึ้น'},
 {id:'vegfest',name:'เทศกาลถือศีลกินผักภูเก็ต',m:9,d:1,city:'hkt',mult:{fam:1.3,bp:1.15},foreign:1.1,text:'ช่วงปลาย ก.ย.–ต้น ต.ค. ราว 9 วัน'}
];
const SEEDED=[
 {id:'concert',name:'คอนเสิร์ตใหญ่',mult:{bp:1.5,cpl:1.4},text:'แฟนเพลงวัยรุ่นและคู่รักจองที่พักใกล้งาน'},
 {id:'conference',name:'งานประชุมนานาชาติ',mult:{biz:1.9},foreign:1.1,text:'บริษัทส่งพนักงานมาร่วมงาน ดีมานด์นักธุรกิจพุ่ง',mice:true},
 {id:'marathon',name:'งานวิ่งมาราธอน',mult:{bp:1.3,fam:1.25,cpl:1.15},text:'นักวิ่งและครอบครัวเดินทางมาพักคืนก่อนแข่ง'},
 {id:'tradefair',name:'งานแสดงสินค้า',mult:{biz:1.5,fam:1.1},text:'ผู้ประกอบการและผู้ซื้อมาร่วมงานหลายวัน',mice:true},
 {id:'sport',name:'การแข่งขันกีฬานานาชาติ',mult:{bp:1.4,cpl:1.2,biz:1.15},foreign:1.2,text:'แฟนกีฬาต่างชาติเดินทางมาชมการแข่งขัน'}
];
const CANCEL_P=.12;
/* ---------- shock library ---------- */
const CATS={macro:'มหภาคและภัยธรรมชาติ',political:'การเมืองและความปลอดภัย',industry:'อุตสาหกรรมและการแข่งขัน',internal:'ปัญหาภายในที่พัก'};
const SEV={minor:'เล็ก',major:'ใหญ่',cat:'รุนแรงมาก'};
const SHOCKS=[
 {id:'quake',cat:'macro',sev:'cat',name:'แผ่นดินไหวรุนแรง',text:'อาคารต้องตรวจความปลอดภัย นักท่องเที่ยวยกเลิกจำนวนมาก',where:c=>c.quake,w:1,dur:[2,3],eff:{all:.55,foreign:.8}},
 {id:'tsunami',cat:'macro',sev:'cat',name:'สึนามิ',text:'ชายฝั่งเสียหาย พื้นที่ไม่ปลอดภัย การท่องเที่ยวหยุดชะงัก',where:c=>c.andaman,w:.6,dur:[4,5],eff:{all:.35}},
 {id:'flood',cat:'macro',sev:'major',name:'น้ำท่วมใหญ่',text:'ถนนถูกตัดขาด การเดินทางหยุดชะงัก ต้นทุนดูแลอาคารเพิ่ม',where:c=>c.flood,months:[6,7,8,9,10],w:2,dur:[2,3],eff:{all:.55,cost:1.25}},
 {id:'storm',cat:'macro',sev:'minor',name:'พายุเข้า',text:'ฝนตกหนักและลมแรง นักท่องเที่ยวเลื่อนทริป',where:()=>true,months:[4,5,6,7,8,9,10],w:3,dur:[1,1],eff:{all:.7},repeat:true},
 {id:'pandemic',cat:'macro',sev:'cat',name:'โรคระบาดรุนแรง',text:'มีการจำกัดการเดินทางและล็อกดาวน์บางพื้นที่ ต่างชาติแทบหายไป',where:()=>true,w:.5,dur:[6,8],eff:{foreign:.15,domestic:.55}},
 {id:'haze',cat:'macro',sev:'minor',name:'ฝุ่นควันหนาแน่น',text:'คุณภาพอากาศแย่ นักท่องเที่ยวบางส่วนเลี่ยงพื้นที่',where:c=>c.haze,months:[0,1,2,3],w:2,dur:[2,2],eff:{all:.85,foreign:.85}},
 {id:'recession',cat:'macro',sev:'major',name:'เศรษฐกิจตกต่ำ',text:'คนลดงบท่องเที่ยว ลูกค้าอ่อนไหวต่อราคามากขึ้น',where:()=>true,w:1.5,dur:[4,5],eff:{all:.85,wtp:.88}},
 {id:'fxstrong',cat:'macro',sev:'minor',name:'เงินบาทแข็งค่า',text:'เที่ยวไทยแพงขึ้นในสายตาต่างชาติ',where:()=>true,w:1.5,dur:[3,3],eff:{foreign:.85}},
 {id:'fxweak',cat:'macro',sev:'minor',name:'เงินบาทอ่อนค่า',text:'เที่ยวไทยคุ้มค่าขึ้นสำหรับต่างชาติ',where:()=>true,w:1.5,dur:[3,3],eff:{foreign:1.15},positive:true},
 {id:'energy',cat:'macro',sev:'minor',name:'ค่าไฟและพลังงานพุ่ง',text:'ต้นทุนคงที่ของทุกโรงแรมสูงขึ้น',where:()=>true,w:2,dur:[3,3],eff:{cost:1.3}},
 {id:'protest',cat:'political',sev:'major',name:'การประท้วงรุนแรง',text:'การชุมนุมยืดเยื้อ ต่างชาติและนักธุรกิจเลี่ยงพื้นที่',where:()=>true,wf:c=>c.protest,w:1,dur:[2,3],eff:{foreign:.6,biz:.75,domestic:.9}},
 {id:'politics',cat:'political',sev:'major',name:'วิกฤตการเมืองระดับประเทศ',text:'การเปลี่ยนแปลงทางการเมืองฉับพลัน (เช่น รัฐประหาร) ความเชื่อมั่นนักเดินทางลดลง',where:()=>true,w:.6,dur:[4,4],eff:{foreign:.65,biz:.8}},
 {id:'terror',cat:'political',sev:'cat',name:'เหตุก่อการร้ายในพื้นที่',text:'ความกังวลด้านความปลอดภัย นักท่องเที่ยวยกเลิกทริป',where:()=>true,w:.4,dur:[3,4],eff:{foreign:.5,domestic:.75}},
 {id:'advisory',cat:'political',sev:'minor',name:'ประกาศเตือนการเดินทาง',text:'ประเทศต้นทางหลักเตือนพลเมืองให้ชะลอการเดินทางมาพื้นที่นี้',where:()=>true,w:1.5,dur:[3,3],eff:{foreign:.7}},
 {id:'newcomp',cat:'industry',sev:'major',name:'โรงแรมคู่แข่งเปิดใหม่',text:'โรงแรมใหม่ (นอกเกม) เปิดใกล้ๆ ลูกค้ามีทางเลือกมากขึ้นถาวร',where:()=>true,w:1.5,perm:true,eff:{A0:1.18}},
 {id:'airbnb',cat:'industry',sev:'minor',name:'ที่พักทางเลือกแบบ Airbnb เพิ่มขึ้น',text:'บ้านและคอนโดให้เช่ารายวันเพิ่มขึ้น แย่งลูกค้าบางส่วนถาวร',where:()=>true,w:1.5,perm:true,eff:{A0:1.1}},
 {id:'labour',cat:'industry',sev:'minor',name:'แรงงานบริการขาดแคลน',text:'พนักงานทุกโรงแรมคาดหวังเงินเดือนสูงขึ้น ความพึงพอใจลดลง',where:()=>true,w:2,dur:[1,1],eff:{staffHit:10},repeat:true},
 {id:'viral',cat:'industry',sev:'minor',name:'คลิปเที่ยวเมืองนี้ไวรัล',text:'ต่างชาติสนใจพื้นที่นี้มากขึ้น',where:()=>true,w:2,dur:[2,2],eff:{foreign:1.3},positive:true},
 {id:'flight',cat:'industry',sev:'minor',name:'สายการบินเปิดเส้นทางบินตรงใหม่',text:'เดินทางสะดวกขึ้น ต่างชาติเพิ่มขึ้น',where:()=>true,w:1.2,dur:[4,4],eff:{foreign:1.25},positive:true},
 {id:'stimulus',cat:'industry',sev:'minor',name:'มาตรการกระตุ้นเที่ยวในประเทศ',text:'รัฐช่วยออกค่าที่พักบางส่วน คนไทยออกเที่ยวมากขึ้น',where:()=>true,w:1.5,dur:[2,2],eff:{domestic:1.25},positive:true},
 {id:'film',cat:'industry',sev:'minor',name:'ซีรีส์ดังถ่ายทำในเมือง',text:'คู่รักและวัยรุ่นตามรอยสถานที่ถ่ายทำ',where:()=>true,w:1,dur:[3,3],eff:{cpl:1.3,bp:1.2},positive:true}
];
const INTERNAL=[
 {id:'pr',name:'วิกฤตด้านชื่อเสียง',variants:['รีวิวลบไวรัลบนโซเชียล','ภาพห้องไม่สะอาดถูกแชร์','ข่าวแขกท้องเสียหลังอาหารเช้า','ข้อมูลแขกรั่วไหล'],text:'ดาวรีวิวลดลงทันที'},
 {id:'overbook',name:'ระบบจองล่ม ห้องเกิน (overbooking)',text:'ต้องย้ายแขกไปที่อื่นและจ่ายชดเชย'},
 {id:'repair',name:'ต้องปิดซ่อม 2 ห้อง',text:'ท่อแตกหรือหลังคารั่ว ขายได้น้อยลงและเสียค่าซ่อม'},
 {id:'gouging',name:'ถูกวิจารณ์ว่าโก่งราคา',text:'ตั้งราคาสูงเกินคู่แข่งมากในช่วงที่มีอีเวนต์ แขกโพสต์ตำหนิ'}
];
const CHAOS={low:{p:.15,max:1,scale:.7,sevW:{minor:1,major:.25,cat:0},name:'ต่ำ'},mid:{p:.3,max:1,scale:1,sevW:{minor:1,major:.7,cat:.12},name:'กลาง'},high:{p:.4,max:2,scale:1.25,sevW:{minor:1,major:1,cat:.45},name:'สูง (โกลาหล)'}};
const CHANNELS={
 billboard:{name:'ป้ายโฆษณา',decay:.8,eff:{bp:.1,fam:.35,cpl:.2,biz:.25}},
 online:{name:'โฆษณาออนไลน์',decay:.5,eff:{bp:.6,fam:.4,cpl:.55,biz:.4}},
 influencer:{name:'อินฟลูเอนเซอร์',decay:.65,eff:{bp:.6,fam:.25,cpl:.8,biz:.1}}
};
const INFLUENCER={none:{name:'ไม่จ้าง',cost:0},micro:{name:'ไมโคร (ผู้ติดตามหลักหมื่น)',cost:3000,cred:[.5,1.1]},macro:{name:'แมคโคร (ผู้ติดตามหลักแสน)',cost:9000,cred:[.7,1.4]}};
const OTA_BOOST={bp:.45,fam:.2,cpl:.35,biz:.3},OTA_COMMISSION=.15;
const BASE_AW=.12,AW_K=.25,A0_BASE=.9;
const COST={fixed:12000,perRoomNight:200,fake:1500,fine:5000,interest:.01,repair:8000,overbook:3000};
const START_CASH=60000;
const SCORE_W={fin:.5,rep:.35,staff:.15};
const NAMES=['ต้น','ฝน','แบงค์','มายด์','นัท','ปลา','เจ','ออม','บีม','แพรว'];
const BOT_NAMES=['บ้านริมทาง','ลานดาวโฮสเทล','ชมวิวเฮาส์','ทับทิมสยาม'];
const ARCH={
 budget:{name:'สายราคาประหยัด',pf:.65,wef:1.1,staff:[{app:45,serv:55,exp:50,prof:40,lang:50},{app:40,serv:50,exp:45,prof:40,lang:45}],bonus:300,mk:{billboard:0,online:800},ota:true,inf:()=>'none'},
 luxury:{name:'สายหรูหรา',pf:1.45,wef:1.2,staff:[{app:88,serv:72,exp:70,prof:82,lang:80},{app:85,serv:70,exp:68,prof:80,lang:75},{app:80,serv:68,exp:72,prof:78,lang:70}],bonus:1500,mk:{billboard:1500,online:600},ota:true,inf:w=>w%4===0?'macro':'none'},
 marketing:{name:'สายเน้นการตลาด',pf:1.0,wef:1.15,staff:[{app:68,serv:60,exp:56,prof:56,lang:65},{app:62,serv:58,exp:54,prof:54,lang:60}],bonus:300,mk:{billboard:300,online:2500},ota:true,inf:w=>w%2===0?'micro':'none'},
 service:{name:'สายเน้นบริการ',pf:1.15,wef:1.15,staff:[{app:62,serv:88,exp:78,prof:66,lang:62},{app:60,serv:85,exp:75,prof:64,lang:58},{app:58,serv:84,exp:72,prof:62,lang:55}],bonus:1500,mk:{billboard:600,online:400},ota:false,inf:()=>'none'}
};
const SKILL={low:{name:'ต่ำ',step:.04,noise:.08,wrong:.3,look:0,event:0},mid:{name:'กลาง',step:.06,noise:.04,wrong:.1,look:.5,event:.5},high:{name:'สูง',step:.08,noise:.01,wrong:0,look:1,event:1}};
function salaryOf(s){return r100(1500+22*(s.app+s.serv+s.exp+s.prof)/4+6*s.lang);}
function makeCandidates(rng){const out=[];const names=NAMES.slice();
  for(let i=0;i<8;i++){const nm=names.splice(Math.floor(rng()*names.length),1)[0];const st=()=>Math.round(30+rng()*65);
    const s={id:'c'+i,name:nm,app:st(),serv:st(),exp:st(),prof:st(),lang:Math.round(5+rng()*90),sat:70,look:Math.floor(rng()*1e9)};s.salary=salaryOf(s);out.push(s);}
  return out;}
function refPrice(city){const c=CITIES[city];let n=0,d=0;SEGMENTS.forEach(s=>{n+=s.wtp*c.demand[s.id];d+=c.demand[s.id];});return n/d;}
function pickWeighted(rng,items,wf){let t=0;const ws=items.map(i=>{const w=Math.max(0,wf(i));t+=w;return w;});if(t<=0)return null;let r=rng()*t;for(let k=0;k<items.length;k++){r-=ws[k];if(r<=0)return items[k];}return items[items.length-1];}
function buildTimeline(g,rng){
  const c=CITIES[g.city],ch=CHAOS[g.chaos];const tl=[];for(let w=0;w<WEEKS;w++)tl.push({scheduled:[],shocks:[]});
  // national/city scheduled
  NATIONAL.forEach(e=>{if(e.city&&e.city!==g.city)return;for(let w=0;w<WEEKS;w++){const s=weekStart(g,w);for(let k=0;k<7;k++){const d=new Date(s.getTime()+k*864e5);if(d.getUTCMonth()===e.m&&d.getUTCDate()===e.d){tl[w].scheduled.push(Object.assign({kind:'national',cancelled:false},e));}}}});
  // seeded city events
  const n=2+(c.mice>=2?1:0);const freeWeeks=[];for(let w=1;w<WEEKS;w++)if(!tl[w].scheduled.length)freeWeeks.push(w);
  for(let i=0;i<n&&freeWeeks.length;i++){const w=freeWeeks.splice(Math.floor(rng()*freeWeeks.length),1)[0];
    const t=pickWeighted(rng,SEEDED,x=>x.mice?(.5+c.mice*.6):1);tl[w].scheduled.push(Object.assign({kind:'city',cancelled:rng()<CANCEL_P},t));}
  // shocks
  const used=new Set();const active={};const lastStart={};const COOLDOWN=4;
  for(let w=0;w<WEEKS;w++){
    const draws=[];for(let k=0;k<ch.max;k++)if(rng()<ch.p)draws.push(k);
    draws.forEach(()=>{const wi=weekInfo(g,w);
      const pool=SHOCKS.filter(s=>s.where(c)&&(!s.months||s.months.includes(wi.month))&&!active[s.id]&&(s.repeat?(lastStart[s.id]===undefined||w-lastStart[s.id]>=COOLDOWN):!used.has(s.id)));
      const s=pickWeighted(rng,pool,x=>x.w*(x.wf?x.wf(c):1)*ch.sevW[x.sev]);if(!s)return;
      used.add(s.id);lastStart[s.id]=w;const d=s.perm?WEEKS-w:(s.dur[0]+Math.floor(rng()*(s.dur[1]-s.dur[0]+1)));active[s.id]=w+d;
      for(let k=0;k<d&&w+k<WEEKS;k++)tl[w+k].shocks.push({ev:s,k,d,start:w,perm:!!s.perm});});
    Object.keys(active).forEach(id=>{if(active[id]<=w+1)delete active[id];});
  }
  return tl;
}
function newHotel(id,name,isPlayer){return {id,name,isPlayer,price:{wd:0,we:0},staff:[],bonus:0,mk:{billboard:0,online:0},inf:'none',ota:true,fake:false,
  stock:{billboard:0,online:0,influencer:0},R:3.5,N:8,cash:START_CASH,otaBan:0,profitCum:0,history:[],fakeCaught:0,closed:0,closedWeeks:0,crises:[]};}
function newGame(opts){
  const rng=mulberry32(hashSeed(String(opts.seed)));
  const g={hotelName:opts.hotelName,seed:opts.seed,city:opts.city,startMonth:opts.startMonth,chaos:opts.chaos,allowFake:!!opts.allowFake,week:0,rng,news:[]};
  g.refP=refPrice(opts.city);g.candidates=makeCandidates(rng);g.timeline=buildTimeline(g,rng);
  const archKeys=Object.keys(ARCH);for(let i=archKeys.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[archKeys[i],archKeys[j]]=[archKeys[j],archKeys[i]];}
  const skills=['low','mid','high'];for(let i=2;i>0;i--){const j=Math.floor(rng()*(i+1));[skills[i],skills[j]]=[skills[j],skills[i]];}
  const p=newHotel('you',opts.hotelName||'โฮสเทลของคุณ',true);p.price.wd=r10(g.refP);p.price.we=r10(g.refP*1.15);p.mk.online=1000;g.hotels=[p];
  for(let i=0;i<3;i++){const a=ARCH[archKeys[i]];const b=newHotel('bot'+i,BOT_NAMES[i],false);b.arch=archKeys[i];b.skill=skills[i];
    const nz=1+(rng()-.5)*.1;b.price.wd=r10(g.refP*a.pf*nz);b.price.we=r10(b.price.wd*a.wef);
    b.staff=a.staff.map((s,k)=>Object.assign({id:b.id+'s'+k,name:'',sat:70},s,{salary:salaryOf(s)}));b.bonus=a.bonus;b.mk=Object.assign({},a.mk);b.ota=a.ota;g.hotels.push(b);}
  return g;}
function schedMultFor(e,seg){return (e.mult&&e.mult[seg.id])||1;}
function botDecide(g,b){
  const a=ARCH[b.arch],sk=SKILL[b.skill],rng=g.rng;const last=b.history[b.history.length-1];
  const sNext=seasonMult(g,g.week),sNow=g.week>0?seasonMult(g,g.week-1):1;
  const known=g.timeline[g.week].scheduled.length>0;
  ['wd','we'].forEach(p=>{let price=b.price[p];
    if(last){const occ=last.occP[p];let dir=0;if(occ>.88)dir=1;else if(occ<.55)dir=-1;if(dir!==0&&rng()<sk.wrong)dir=-dir;price*=1+dir*sk.step;}
    price*=1+sk.look*.35*(sNext-sNow);
    if(known)price*=1+.12*sk.event; if(g.week>0&&g.timeline[g.week-1].scheduled.length&&!known)price*=1-.1*sk.event;
    price*=1+(rng()*2-1)*sk.noise;b.price[p]=r10(clamp(price,g.refP*.4,g.refP*2.5));});
  b.inf=a.inf(g.week+1);}
function awareness(h,seg){let x=0;Object.keys(CHANNELS).forEach(c=>{x+=CHANNELS[c].eff[seg.id]*h.stock[c];});
  let aw=BASE_AW+(1-BASE_AW)*(1-Math.exp(-AW_K*x));let otaPart=0;
  if(h.ota&&h.otaBan===0){const tot=1-(1-aw)*(1-OTA_BOOST[seg.id]);otaPart=tot-aw;aw=tot;}return {aw,otaShare:aw>0?otaPart/aw:0};}
function teamQuality(h,seg,fs,occRooms){
  if(h.staff.length===0)return {q:0,adequacy:0,lang:0,base:0};
  let base=0,lang=0,sat=0;h.staff.forEach(s=>{base+=seg.w.app*s.app+seg.w.serv*s.serv+seg.w.exp*s.exp+seg.w.prof*s.prof;lang+=s.lang;sat+=s.sat;});
  base/=h.staff.length;lang/=h.staff.length;sat/=h.staff.length;
  const adequacy=Math.min(1,h.staff.length/(1+occRooms/3));
  let q=base*(0.55+0.45*adequacy)*(0.85+0.15*sat/100);const qF=q-Math.max(0,60-lang)*0.4;q=q*(1-fs)+qF*fs;
  return {q,adequacy,lang,base};}
function weekEffects(g,w){
  const tl=g.timeline[w],ch=CHAOS[g.chaos];const E={seg:{},foreign:1,domestic:1,cost:1,A0:1,staffHit:0,wtp:1,list:[]};
  SEGMENTS.forEach(s=>E.seg[s.id]=1);
  tl.scheduled.forEach(e=>{if(e.cancelled)return;SEGMENTS.forEach(s=>E.seg[s.id]*=schedMultFor(e,s));if(e.foreign)E.foreign*=e.foreign;});
  tl.shocks.forEach(sh=>{const inten=sh.perm?1:1-sh.k/sh.d;const sc=m=>1+(m-1)*ch.scale*inten;const f=sh.ev.eff;
    if(f.all)SEGMENTS.forEach(s=>E.seg[s.id]*=sc(f.all));SEGMENTS.forEach(s=>{if(f[s.id])E.seg[s.id]*=sc(f[s.id]);});
    if(f.foreign)E.foreign*=sc(f.foreign);if(f.domestic)E.domestic*=sc(f.domestic);if(f.cost)E.cost*=sc(f.cost);if(f.A0)E.A0*=f.A0;if(f.wtp)E.wtp*=sc(f.wtp);
    if(f.staffHit)E.staffHit+=f.staffHit*ch.scale*inten;});
  return E;}
function simulateWeek(g){
  const w=g.week,c=CITIES[g.city],rng=g.rng;g.hotels.forEach(h=>{if(!h.isPlayer)botDecide(g,h);});
  const E=weekEffects(g,w);const season=seasonMult(g,w);const segDemand={};
  SEGMENTS.forEach(s=>{const fs=clamp(c.foreign*s.fb,0,.95);const d=c.demand[s.id]*season*E.seg[s.id]*((1-fs)*E.domestic+fs*E.foreign)*(0.92+rng()*0.16);segDemand[s.id]={total:d,fs};});
  g.hotels.forEach(h=>{h.stock.billboard=h.stock.billboard*CHANNELS.billboard.decay+h.mk.billboard/1000;h.stock.online=h.stock.online*CHANNELS.online.decay+h.mk.online/1000;
    let add=0;h.infCred=null;if(h.inf!=='none'){const I=INFLUENCER[h.inf];h.infCred=I.cred[0]+rng()*(I.cred[1]-I.cred[0]);add=I.cost/1000*h.infCred;}
    h.stock.influencer=h.stock.influencer*CHANNELS.influencer.decay+add;});
  const A0=A0_BASE*E.A0;const res={};g.hotels.forEach(h=>res[h.id]={sold:{wd:0,we:0},rev:{wd:0,we:0},otaRev:0,seg:{},aw:{}});
  g.hotels.forEach(h=>SEGMENTS.forEach(s=>res[h.id].aw[s.id]=awareness(h,s).aw));
  ['wd','we'].forEach(p=>{const want={},segBook={};g.hotels.forEach(h=>want[h.id]=0);
    SEGMENTS.forEach(s=>{const D=segDemand[s.id].total*(p==='wd'?s.wdShare:1-s.wdShare);const A={};let sum=0;const wtp=s.wtp*E.wtp;
      g.hotels.forEach(h=>{const a=awareness(h,s);const U=s.bp*(1-h.price[p]/wtp)+0.9*(h.R-3.5);A[h.id]={v:a.aw*Math.exp(U),ota:a.otaShare};sum+=A[h.id].v;});
      g.hotels.forEach(h=>{const b=D*A[h.id].v/(A0+sum);segBook[h.id+s.id]={b,ota:A[h.id].ota};want[h.id]+=b;});});
    const cap={},filled={};let spill=0;
    g.hotels.forEach(h=>{cap[h.id]=(ROOMS-h.closed)*NIGHTS[p];filled[h.id]=Math.min(cap[h.id],want[h.id]);spill+=Math.max(0,want[h.id]-cap[h.id])*.5;});
    if(spill>0){const room=g.hotels.filter(h=>filled[h.id]<cap[h.id]);let tw=0;room.forEach(h=>tw+=want[h.id]+.01);room.forEach(h=>{filled[h.id]=Math.min(cap[h.id],filled[h.id]+spill*(want[h.id]+.01)/tw);});}
    g.hotels.forEach(h=>{const scale=want[h.id]>0?filled[h.id]/want[h.id]:0;const sold=Math.round(filled[h.id]);res[h.id].sold[p]=sold;res[h.id].rev[p]=sold*h.price[p];
      SEGMENTS.forEach(s=>{const sb=segBook[h.id+s.id];const n=sb.b*scale;res[h.id].seg[s.id]=(res[h.id].seg[s.id]||0)+n;res[h.id].otaRev+=n*h.price[p]*sb.ota;});});});
  const out={week:w+1,info:weekInfo(g,w),season,tl:g.timeline[w],E,hotels:{},news:[]};
  const compAvgPrice=g.hotels.filter(h=>!h.isPlayer).reduce((a,h)=>a+(h.price.wd*5+h.price.we*2)/7,0)/3;
  const eventWeek=g.timeline[w].scheduled.some(e=>!e.cancelled);
  g.hotels.forEach(h=>{
    const r=res[h.id];const sold=r.sold.wd+r.sold.we;const occRooms=sold/7;const avgP=(r.rev.wd+r.rev.we)/(sold||1);
    const segQ={};let qS=0,eS=0,rS=0,nS=0,adequacy=0,lang=0;
    SEGMENTS.forEach(s=>{const t=teamQuality(h,s,segDemand[s.id].fs,occRooms);adequacy=t.adequacy;lang=t.lang;const Ex=30+30*Math.min(avgP/s.wtp,1.6);const rating=clamp(3.4+(t.q-Ex)/12,1,5);
      segQ[s.id]={q:t.q,e:Ex,rating,n:r.seg[s.id]||0};const n=r.seg[s.id]||0;if(n>0){qS+=t.q*n;eS+=Ex*n;rS+=rating*n;nS+=n;}});
    const Q=nS?qS/nS:0,Ex=nS?eS/nS:0;let rating=nS?rS/nS:0;const notes=[];const crises=[];
    // internal crises (Faulkner: self-inflicted crisis)
    const last=h.history[h.history.length-1];
    let pPR=.02+(last&&last.rating&&last.rating<3?.08:0)+(adequacy<.8&&sold>0?.04:0);
    if(rng()<pPR){const v=INTERNAL[0].variants[Math.floor(rng()*4)];crises.push({id:'pr',name:INTERNAL[0].name,detail:v});h.R=Math.max(1,h.R-.45);}
    let extra=0;
    if(last&&last.occ>.92&&rng()<.15){crises.push({id:'overbook',name:INTERNAL[1].name,detail:INTERNAL[1].text});extra+=COST.overbook;h.R=Math.max(1,h.R-.2);}
    if(h.closedWeeks>0){h.closedWeeks--;if(h.closedWeeks===0)h.closed=0;}
    else if(rng()<.03){crises.push({id:'repair',name:INTERNAL[2].name,detail:INTERNAL[2].text});extra+=COST.repair;h.closed=2;h.closedWeeks=2;}
    const myP=(h.price.wd*5+h.price.we*2)/7;
    if(eventWeek&&myP>compAvgPrice*1.6&&rng()<.3){crises.push({id:'gouging',name:INTERNAL[3].name,detail:INTERNAL[3].text});h.R=Math.max(1,h.R-.25);}
    const newRev=Math.round(sold*.15);if(newRev>0){h.R=(h.R*h.N+rating*newRev)/(h.N+newRev);h.N+=newRev;}
    if(h.infCred!==null&&rating&&rating<3){h.R=Math.max(1,h.R-.25);notes.push('infBad');}
    let fine=0,fakeCost=0,caught=false;
    if(h.fake){fakeCost=COST.fake;h.R=(h.R*h.N+5*6)/(h.N+6);h.N+=6;if(rng()<.25){caught=true;h.R=Math.max(1,h.R-.7);fine=COST.fine;h.otaBan=3;h.fakeCaught++;notes.push('caught');}}
    else if(h.otaBan>0)h.otaBan--;
    const load=h.staff.length?sold/h.staff.length:0;const bonusPer=h.staff.length?h.bonus/h.staff.length:0;
    h.staff.forEach(s=>{s.sat=clamp(s.sat+2-Math.max(0,load-15)*1.2+bonusPer/100-E.staffHit,0,100);});
    const teamSat=h.staff.length?h.staff.reduce((a,s)=>a+s.sat,0)/h.staff.length:0;const quits=[];
    if(h.staff.length&&teamSat<40){h.staff=h.staff.filter(s=>{if(rng()<.15){quits.push(s.name||'พนักงาน');return false;}return true;});}
    const team={};['app','serv','exp','prof','lang'].forEach(k=>team[k]=h.staff.length?h.staff.reduce((a,s)=>a+s[k],0)/h.staff.length:0);
    const revenue=r.rev.wd+r.rev.we,commission=r.otaRev*OTA_COMMISSION,infCost=h.inf!=='none'?INFLUENCER[h.inf].cost:0;
    const costs={severance:h.severance||0,fixed:COST.fixed*E.cost,variable:COST.perRoomNight*sold,salaries:h.staff.reduce((a,s)=>a+s.salary,0),bonus:h.bonus,marketing:h.mk.billboard+h.mk.online+infCost,commission,fake:fakeCost,fine,crisis:extra,interest:h.cash<0?-h.cash*COST.interest:0};
    h.severance=0;const costTotal=Object.values(costs).reduce((a,b)=>a+b,0);const profit=revenue-costTotal;h.cash+=profit;h.profitCum+=profit;
    // eWOM: review distribution
    const dist=[0,0,0,0,0];for(let i=0;i<newRev;i++){const v=clamp(Math.round(rating+(rng()+rng()+rng()-1.5)*1.1),1,5);dist[v-1]++;}
    let awAvg=0;SEGMENTS.forEach(s=>awAvg+=r.aw[s.id]/4);
    const rec={sold,soldP:r.sold,occ:sold/(ROOMS*7),occP:{wd:r.sold.wd/(ROOMS*5),we:r.sold.we/(ROOMS*2)},revenue,adr:sold?revenue/sold:0,revpar:revenue/(ROOMS*7),
      price:Object.assign({},h.price),Q,E:Ex,rating,R:h.R,N:h.N,teamSat,team,load,adequacy,lang,quits,costs,costTotal,profit,cash:h.cash,awAvg,aw:r.aw,segQ,dist,newRev,
      commission,otaRev:r.otaRev,caught,notes,crises,inf:h.inf,infCred:h.infCred,fake:h.fake,otaBan:h.otaBan,seg:r.seg,staffN:h.staff.length,closed:h.closed};
    h.history.push(rec);out.hotels[h.id]=rec;h.inf='none';
    if(!h.isPlayer)crises.forEach(cr=>out.news.push(`${h.name}: ${cr.name}${cr.detail?` (${cr.detail})`:''}`));
  });
  const bots=g.hotels.filter(h=>!h.isPlayer).map(h=>out.hotels[h.id]);
  const cSold=bots.reduce((a,b)=>a+b.sold,0),cRev=bots.reduce((a,b)=>a+b.revenue,0),cAvail=bots.length*ROOMS*7;
  out.comp={occ:cSold/cAvail,adr:cSold?cRev/cSold:0,revpar:cRev/cAvail,aw:{},R:bots.reduce((a,b)=>a+b.R,0)/bots.length,Q:bots.reduce((a,b)=>a+b.Q,0)/bots.length};
  SEGMENTS.forEach(s=>out.comp.aw[s.id]=bots.reduce((a,b)=>a+b.aw[s.id],0)/bots.length);
  const y=out.hotels.you;out.idx={mpi:out.comp.occ?y.occ/out.comp.occ*100:0,ari:out.comp.adr&&y.adr?y.adr/out.comp.adr*100:0,rgi:out.comp.revpar?y.revpar/out.comp.revpar*100:0};
  out.marketOcc=g.hotels.reduce((a,h)=>a+out.hotels[h.id].sold,0)/(g.hotels.length*ROOMS*7);
  g.news.push(...out.news.map(t=>({week:w+1,text:t})));
  g.week++;return out;}
function finalScores(g){
  const maxPos=Math.max(0,...g.hotels.map(h=>h.profitCum));
  return g.hotels.map(h=>{const fin=h.profitCum<=0||maxPos===0?0:h.profitCum/maxPos*100;const rep=(h.R-1)/4*100;
    const sats=h.history.map(x=>x.teamSat);const staff=sats.length?sats.reduce((a,b)=>a+b,0)/sats.length:0;
    return {id:h.id,name:h.name,fin,rep,staff,score:SCORE_W.fin*fin+SCORE_W.rep*rep+SCORE_W.staff*staff,profit:h.profitCum,cash:h.cash,R:h.R};}).sort((a,b)=>((b.profit>0)-(a.profit>0))||(b.score-a.score));}
if(typeof module!=='undefined')module.exports={COOLDOWN_INFO:4,newGame,simulateWeek,finalScores,seasonMult,weekInfo,tmdSeason,buildTimeline,CITIES,MAPS,SHOCKS,CHAOS,SEGMENTS,ARCH,SKILL,WEEKS,mulberry32,hashSeed};
