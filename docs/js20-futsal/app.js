(() => {
  const root = window.JS20_DATA;
  if (!root) return;
  const year = root.activeEdition;
  const e = root.editions[year];
  const $ = (id) => document.getElementById(id);
  const set = (id, value) => { const el = $(id); if (el && value != null) el.textContent = value; };

  set('editionYear', e.year);
  set('heroYear', e.year);
  set('footerYear', e.year);
  set('dateLabel', e.dateLabel);
  set('kickoff', e.kickoff || 'TBA');
  set('tagline', e.tagline);
  set('teamAName', e.teams[0].name);
  set('teamBName', e.teams[1].name);
  set('teamACode', e.teams[0].short);
  set('teamBCode', e.teams[1].short);
  set('matchKickoff', e.kickoff || 'TBA');
  set('matchVenue', e.venue || 'VENUE TBA');
  set('matchDate', e.dateLabel.replace(String(e.year), '').trim());

  const status = e.phase === 'post' ? 'FULL TIME' : e.phase === 'live' ? 'LIVE' : 'SCHEDULED';
  set('statusPill', status);

  const target = new Date(`${e.dateISO}T00:00:00+09:00`).getTime();
  const now = Date.now();
  const days = Math.max(0, Math.ceil((target - now) / 86400000));
  set('daysLeft', e.phase === 'post' ? '00' : String(days).padStart(2, '0'));

  const sponsorLink = $('sponsorLink');
  if (sponsorLink) sponsorLink.href = e.sponsor.url;

  const awards = [
    ['champion', 0], ['goldenBoot', 1], ['assistKing', 2], ['mvp', 3]
  ];
  const cards = Array.from(document.querySelectorAll('.award-card b'));
  awards.forEach(([key, i]) => { if (e.awards[key]) cards[i].textContent = e.awards[key]; });

  const draftButton = $('draftButton');
  const draftMessage = $('draftMessage');
  const players = Array.isArray(e.players) ? e.players : [];
  if (!players.length) {
    draftButton.disabled = false;
    draftButton.addEventListener('click', () => {
      draftMessage.textContent = 'LINEUP PENDING — 선수 명단이 들어오면 이 버튼이 실제 팀 추천을 실행합니다.';
      draftButton.textContent = 'SQUAD NOT READY YET';
      setTimeout(() => { draftButton.innerHTML = 'BUILD THE TEAMS <span>↻</span>'; }, 1700);
    });
  } else {
    draftMessage.textContent = `${players.length} PLAYERS READY · 클릭할 때마다 밸런스를 다시 계산합니다.`;
    draftButton.addEventListener('click', () => {
      const shuffled = [...players].sort(() => Math.random() - .5);
      const teams = [[], []], totals = [0, 0];
      shuffled.sort((a,b) => (b.rating || 1) - (a.rating || 1));
      shuffled.forEach(p => {
        const t = totals[0] <= totals[1] ? 0 : 1;
        teams[t].push(p); totals[t] += p.rating || 1;
      });
      draftMessage.textContent = `추천 완료 · GREEN ${totals[0]} : WHITE ${totals[1]} · 최종 확정 전 자유롭게 다시 추천 가능`;
      renderSquads(teams);
      document.querySelector('#squads').scrollIntoView({ behavior:'smooth' });
    });
  }

  function renderSquads(teams) {
    const board = $('squadBoard');
    board.innerHTML = teams.map((team, idx) => `
      <div style="padding:28px;min-width:0;">
        <div style="font:900 12px/1 Arial;letter-spacing:2px;color:${idx===0?'#b9ff4b':'#fff'};margin-bottom:18px">${idx===0?'TEAM GREEN':'TEAM WHITE'}</div>
        ${team.map((p,n)=>`<div style="display:flex;justify-content:space-between;gap:18px;padding:11px 0;border-top:1px solid rgba(255,255,255,.12);font-size:13px"><b>${String(n+1).padStart(2,'0')}</b><span>${p.name}</span></div>`).join('')}
      </div>`).join('');
    board.style.gridTemplateColumns = '1fr 1fr';
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
  }, { threshold:.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();
