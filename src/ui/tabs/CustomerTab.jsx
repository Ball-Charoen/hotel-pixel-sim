import { CITIES, SEGMENTS, mulberry32, clamp } from '../../sim/core.js';
import { HBar, LineChart, Src } from '../components/widgets.jsx';
import { fmt, weekShort } from '../format.js';
import { t, tx } from '../../i18n/index.js';
import { N, crisisDetail } from '../names.js';

/* Up to 5 sample reviews, each picked from the real cause in this week's result (seeded by week). */
function reviewsFor(G, r, week) {
  const rng = mulberry32(week * 977 + 13);
  const out = [];
  const avgP = r.adr || 0;
  const pick = c => c[Math.floor(rng() * c.length)];
  SEGMENTS.slice().sort((a, b) => (r.seg[b.id] || 0) - (r.seg[a.id] || 0)).forEach(s => {
    const sq = r.segQ[s.id];
    if (!sq || sq.n < 1) return;
    const tm = r.team;
    const fs = clamp(CITIES[G.city].foreign * s.fb, 0, 0.95);
    let text, kind;
    if (sq.rating >= 4) {
      const c = [];
      if (tm.serv >= 70) c.push('serv');
      if (avgP <= s.wtp * 0.9) c.push('value');
      if (tm.app >= 70) c.push('app');
      if (tm.lang >= 70 && fs > 0.3) c.push('lang');
      if (tm.prof >= 70 && s.id === 'biz') c.push('prof');
      if (tm.exp >= 70) c.push('exp');
      if (!c.length) c.push('value');
      text = t(`reviews.pos.${pick(c)}`); kind = 'pos';
    } else if (sq.rating <= 2.6) {
      const c = [];
      if (r.adequacy < 0.8) c.push('adequacy');
      if (avgP > s.wtp * 1.2) c.push('price');
      if (tm.lang < 45 && fs > 0.3) c.push('lang');
      if (tm.serv < 50) c.push('serv');
      if (tm.prof < 50 && s.id === 'biz') c.push('prof');
      if (tm.exp < 50) c.push('exp');
      if (!c.length) c.push('price');
      text = t(`reviews.neg.${pick(c)}`); kind = 'neg';
    } else {
      text = t('reviews.neu'); kind = 'neu';
    }
    out.push({ seg: s, stars: Math.round(sq.rating), text, kind });
  });
  (r.crises || []).filter(c => c.id === 'pr').forEach(c => out.unshift({ seg: null, stars: 1, text: t('customer.viral', { detail: crisisDetail(c) }), kind: 'neg' }));
  return out.slice(0, 5);
}

export function CustomerTab({ s }) {
  const { G, last: o, log } = s;
  if (!o) {
    return <div class="panel"><h2>{t('customer.emptyTitle')}</h2><p>{t('customer.emptyText')}</p></div>;
  }
  const y = o.hotels.you;
  const d = y.dist;
  const tot = d.reduce((a, b) => a + b, 0) || 1;
  const pos = (d[3] + d[4]) / tot, neu = d[2] / tot, neg = (d[0] + d[1]) / tot;
  const rvs = reviewsFor(G, y, o.week);
  return (
    <div class="grid4">
      <div class="panel">
        <h2>{t('customer.awTitle')}</h2>
        <p class="small">{t('customer.awIntro')}</p>
        {SEGMENTS.map(sg => (
          <HBar key={sg.id} label={N.seg(sg.id)} v={y.aw[sg.id] * 100} mark={o.comp.aw[sg.id] * 100} right={Math.round(y.aw[sg.id] * 100) + '%'} />
        ))}
      </div>
      <div class="panel">
        <h2>{t('customer.gapTitle')}</h2>
        <p class="small">{tx('customer.gapIntro', { src: <Src k="servqual">SERVQUAL</Src> })}</p>
        {SEGMENTS.map(sg => {
          const q = y.segQ[sg.id];
          return (
            <HBar key={sg.id} label={<>{N.seg(sg.id)}<br /><span class="small muted">{t('customer.roomNights', { n: Math.round(q.n) })}</span></>}
              v={q.q} mark={q.e} right={`${q.rating.toFixed(1)}★`} />
          );
        })}
      </div>
      <div class="panel">
        <h2>{t('customer.satTitle')}</h2>
        <p>{tx('customer.satLine', {
          newRev: <b>{y.newRev}</b>, rating: <b>{y.rating ? y.rating.toFixed(2) : '–'}</b>, R: <b>{y.R.toFixed(2)}</b>, N: fmt(y.N),
        })}</p>
        {[5, 4, 3, 2, 1].map(k => <HBar key={k} label={'★'.repeat(k)} v={d[k - 1]} max={Math.max(1, ...d)} right={d[k - 1]} />)}
        <div class="segbar" style="margin-top:10px">
          <span style={{ width: `${pos * 100}%`, background: 'var(--jade)' }} />
          <span style={{ width: `${neu * 100}%`, background: 'var(--sh)' }} />
          <span style={{ width: `${neg * 100}%`, background: 'var(--chili)' }} />
        </div>
        <div class="legend">
          <span style={{ '--c': 'var(--jade)' }}>{t('customer.pos', { p: Math.round(pos * 100) })}</span>
          <span style={{ '--c': 'var(--sh)' }}>{t('customer.neu', { p: Math.round(neu * 100) })}</span>
          <span style={{ '--c': 'var(--chili)' }}>{t('customer.neg', { p: Math.round(neg * 100) })}</span>
        </div>
        <div class="chart" style="margin-top:8px">
          <LineChart aria={t('customer.ratingAria')} h={160} labels={log.map(r => weekShort(r.week))} series={[
            { name: t('customer.seriesRating'), color: 'var(--lamp)', values: log.map(r => r.rating) },
            { name: t('customer.seriesR'), color: 'var(--jade)', values: log.map(r => r.R) },
          ]} />
        </div>
      </div>
      <div class="panel">
        <h2>{t('customer.ewomTitle')}</h2>
        <p class="small">{tx('customer.ewomIntro', { src: <Src k="litvin">Litvin et al., 2008</Src> })}</p>
        {rvs.length
          ? rvs.map((r, i) => (
            <div key={i} class="review">
              <span class="stars">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>{' '}
              <span class="small muted">{r.seg ? N.seg(r.seg.id) : t('customer.social')}</span><br />{r.text}
            </div>
          ))
          : <p class="muted small">{t('customer.noReviews')}</p>}
        {y.fake && <p class="warn">{t('customer.fakeWarn')}</p>}
      </div>
    </div>
  );
}
