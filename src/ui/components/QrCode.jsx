/* QR code drawn locally (uqr, MIT): the room link never goes to an outside QR service.
   Black on white with a quiet zone, crisp squares, so phones scan it reliably from a projector. */
import { useState, useEffect } from 'preact/hooks';

export function QrCode({ text, size = 160, label }) {
  const [q, setQ] = useState(null);
  useEffect(() => {
    let alive = true;
    import('uqr').then(({ encode }) => { if (alive) setQ(encode(text, { ecc: 'M', border: 2 })); });
    return () => { alive = false; };
  }, [text]);
  if (!q) return <div style={{ width: size, height: size }} />;
  let d = '';
  q.data.forEach((row, y) => row.forEach((on, x) => { if (on) d += `M${x} ${y}h1v1h-1z`; }));
  return (
    <svg class="qr" width={size} height={size} viewBox={`0 0 ${q.size} ${q.size}`} shape-rendering="crispEdges" role="img" aria-label={label}>
      <rect width={q.size} height={q.size} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}
