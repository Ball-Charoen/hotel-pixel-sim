import { t } from '../i18n/index.js';

export const fmt = n => Math.round(n).toLocaleString('th-TH');
export const pct = x => (x * 100).toFixed(1) + '%';
export const baht = n => t('unit.baht', { amount: fmt(n) });
export const weekShort = n => t('unit.weekShort', { n });
