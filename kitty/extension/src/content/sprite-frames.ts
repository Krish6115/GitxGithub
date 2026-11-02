// Original 16x16 pixel frames for Kitty. K outline, O fur, L belly/cheeks, P nose/ears, E eyes, Z sleep "z".

export const PALETTE: Record<string, string> = {
  K: '#2b2133',
  O: '#f0a04b',
  L: '#ffe2b8',
  P: '#f27c9a',
  E: '#2b2133',
  Z: '#7aa2f7',
};

const IDLE = [
  '...K.......K....',
  '..KOK.....KOK...',
  '..KPOK...KOPK...',
  '..KOOOKKKOOOK...',
  '.KOOOOOOOOOOOK..',
  '.KOOEOOOOOEOOK..',
  '.KOOEOOOOOEOOK..',
  '.KOLLOOPOOLLOK..',
  '.KOOOOKOKOOOOK..',
  '..KOOOOOOOOOK...',
  '...KOOLLLOOK....',
  '..KOOLLLLLOOK...',
  '..KOOLLLLLOOK.K.',
  '..KOOLLLLLOOKKOK',
  '..KOOOOOOOOOOOK.',
  '...KKKKKKKKKKK..',
];

const withRows = (base: string[], rows: Record<number, string>): string[] => base.map((r, i) => rows[i] ?? r);

export const FRAMES = {
  idle: IDLE,
  // eyes closed for a blink
  blink: withRows(IDLE, { 5: '.KOOOOOOOOOOOK..', 6: '.KOKKOOOOOKKOK..' }),
  // tail tip flicks up
  tail: withRows(IDLE, { 11: '..KOOLLLLLOOK.K.', 12: '..KOOLLLLLOOKKOK', 13: '..KOOLLLLLOOK.K.' }),
  // three walking poses (legs move, body bobs one pixel on B)
  walkA: withRows(IDLE, { 14: '..KOOOOOOOOOOOK.', 15: '..KK.K....K.KK..' }),
  walkB: withRows(IDLE, { 14: '..KOKOOOOOOKOOK.', 15: '...KK..KK..KK...' }),
  walkC: withRows(IDLE, { 14: '..KOOOOOOOOOOOK.', 15: '..K.KK....KK.K..' }),
  // curled up asleep, with a little z
  sleep: [
    '............ZZ..',
    '.............Z..',
    '............ZZ..',
    '................',
    '................',
    '................',
    '....K......K....',
    '...KOK....KOK...',
    '..KOOOKKKKOOOK..',
    '.KOOOOOOOOOOOOK.',
    '.KOKKOOOOOOKKOK.',
    '.KOOOOOOPOOOOOK.',
    '.KOOLLLLLLLLOOKK',
    '.KOOLLLLLLLLOOKO',
    '..KKKKKKKKKKKKOK',
    '...........KKK..',
  ],
} satisfies Record<string, string[]>;

export type FrameName = keyof typeof FRAMES;
