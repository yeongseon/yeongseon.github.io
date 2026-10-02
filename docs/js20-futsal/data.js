/*
 * JS20 FUTSAL CUP — annual data file
 * Update this file each year; the UI reads only window.JS20_DATA.
 */
window.JS20_DATA = {
  activeEdition: 2026,
  editions: {
    2026: {
      year: 2026,
      dateLabel: '17 OCT 2026',
      dateISO: '2026-10-17',
      kickoff: 'TBA',
      venue: 'VENUE TBA',
      phase: 'pre', // pre | live | post
      tagline: 'BACK TOGETHER. BACK ON THE PITCH.',
      teams: [
        { id: 'green', name: 'TEAM GREEN', short: 'GRN', score: null },
        { id: 'white', name: 'TEAM WHITE', short: 'WHT', score: null }
      ],
      players: [],
      awards: {
        champion: null,
        goldenBoot: null,
        assistKing: null,
        mvp: null,
        goldenGlove: null
      },
      sponsor: {
        name: '신선포도농원',
        brand: 'FRESH PODO',
        url: 'https://m.smartstore.naver.com/fresh_podo'
      }
    }
  }
};
