/* 8×8 pixel icons for tabs, headings and the top bar. '#' = a filled pixel; the colour comes from CSS (currentColor). */
const ICONS = {
  calendar: ['.#....#.', '########', '########', '#......#', '#.##.#.#', '#......#', '#.#.##.#', '########'],
  sliders: ['.##.....', '########', '.##.....', '........', '.....##.', '########', '.....##.', '........'],
  person: ['..####..', '..####..', '..####..', '...##...', '.######.', '########', '#.####.#', '..#..#..'],
  star: ['...##...', '...##...', '########', '.######.', '..####..', '.######.', '.##..##.', '.#....#.'],
  chart: ['......##', '......##', '...##.##', '...##.##', '##.##.##', '##.##.##', '##.##.##', '########'],
  cash: ['........', '########', '#......#', '#..##..#', '#.#..#.#', '#..##..#', '#......#', '########'],
  news: ['########', '#......#', '#.####.#', '#......#', '#.##.#.#', '#......#', '#.####.#', '########'],
  heart: ['.##..##.', '########', '########', '########', '.######.', '..####..', '...##...', '........'],
  bubble: ['########', '#......#', '#.####.#', '#......#', '#.###..#', '########', '.##.....', '.#......'],
  trophy: ['########', '#.####.#', '#.####.#', '.######.', '..####..', '...##...', '..####..', '.######.'],
  search: ['.####...', '#....#..', '#....#..', '#....#..', '.####...', '....##..', '.....##.', '......##'],
  sun: ['#..##..#', '.#....#.', '..####..', '#.####.#', '#.####.#', '..####..', '.#....#.', '#..##..#'],
  hotel: ['...##...', '..####..', '.######.', '########', '#.#..#.#', '########', '#.#..#.#', '########'],
  drop: ['...##...', '...##...', '..####..', '.######.', '########', '########', '.######.', '..####..'],
  wind: ['..####..', '.....#.#', '########', '........', '#######.', '......#.', '.####.#.', '........'],
  pie: ['..####..', '.###.##.', '####.###', '####.###', '########', '########', '.######.', '..####..'],
};

/* Each row becomes a few rects (runs of '#'), so an icon is ~20 elements. */
const RUNS = Object.fromEntries(Object.entries(ICONS).map(([k, rows]) => {
  const out = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== '#') continue;
      let w = 1;
      while (row[x + w] === '#') w++;
      out.push([x, y, w]);
      x += w - 1;
    }
  });
  return [k, out];
}));

/* Thai seasons (TMD): hot = sun, rainy = water drop, cool = wind. */
export const TMD_ICON = { summer: 'sun', rainy: 'drop', winter: 'wind' };

export const ICON_NAMES = Object.keys(ICONS);

export function PixelIcon({ k, size = '1em' }) {
  return (
    <svg class="pxicon" viewBox="0 0 8 8" width={size} height={size} shape-rendering="crispEdges" aria-hidden="true" focusable="false">
      {RUNS[k].map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height="1" fill="currentColor" />)}
    </svg>
  );
}

/* The magenta square in front of a panel heading, with a white icon inside. */
export const Badge = ({ k }) => <span class="badge"><PixelIcon k={k} /></span>;
