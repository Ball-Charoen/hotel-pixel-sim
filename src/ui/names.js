/* Display names for everything the sim core identifies by id (cities, events, staff, hotels...).
   Text lives in src/i18n/<lang>.json under "data". */
import { t } from '../i18n/index.js';

export const N = {
  month: i => t('data.month')[i],
  monthFull: i => t('data.monthFull')[i],
  season: lab => t(`data.season.${lab}`),
  tmd: k => t(`data.tmd.${k}`),
  cat: k => t(`data.cat.${k}`),
  sev: k => t(`data.sev.${k}`),
  map: k => t(`data.map.${k}`),
  city: id => t(`data.city.${id}.name`),
  cityLm: id => t(`data.city.${id}.lm`),
  cityStory: id => t(`data.city.${id}.story`),
  seg: id => t(`data.seg.${id}`),
  chaos: k => t(`data.chaos.${k}`),
  skill: k => t(`data.skill.${k}`),
  arch: k => t(`data.arch.${k}`),
  inf: k => t(`data.inf.${k}`),
  event: id => t(`data.event.${id}.name`),
  eventText: id => t(`data.event.${id}.text`),
  shock: id => t(`data.shock.${id}.name`),
  shockText: id => t(`data.shock.${id}.text`),
  internal: id => t(`data.internal.${id}.name`),
  staff: name => (name ? t(`data.staff.${name}`) : t('data.staffFallback')),
  // The player's hotel keeps the name they typed; bots are looked up by id.
  hotel: h => (h.isPlayer ? h.name || t('setup.defaultHotelName') : t(`data.bot.${h.id}`)),
  // Optional owner line under a hotel's name (empty when the player left it blank; bots have none).
  owner: h => (h.owner ? t('unit.owner', { name: h.owner }) : ''),
};

/* Detail line of an internal crisis: the reputation crisis has 4 variants, the others one text. */
export const crisisDetail = c => (c.id === 'pr' ? t('data.internal.pr.variants')[c.v] : t(`data.internal.${c.id}.text`));

/* "1–7 พ.ย." or "29 พ.ย. – 5 ธ.ค." from the week's start/end dates (UTC). */
export function weekLabel(wi) {
  const s = wi.start, e = wi.end;
  const d = x => t('unit.dayMonth', { d: x.getUTCDate(), m: N.month(x.getUTCMonth()) });
  return s.getUTCMonth() === e.getUTCMonth()
    ? t('unit.dayRange', { a: s.getUTCDate(), b: e.getUTCDate(), m: N.month(e.getUTCMonth()) })
    : t('unit.dateRange', { a: d(s), b: d(e) });
}

/* Market news item stored by the core as {week, hotel, id, v}. */
export function newsText(G, n) {
  const h = G.hotels.find(x => x.id === n.hotel);
  return t('unit.news', { hotel: N.hotel(h), crisis: N.internal(n.id), detail: crisisDetail(n) });
}
