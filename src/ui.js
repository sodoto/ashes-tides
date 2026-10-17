
/* ===== UI ===== */
const $app = document.getElementById('app');
const $toast = document.getElementById('toast');
const GAME_VERSION = '__VERSION__'; /* filled in by build.sh from VERSION in sw.js */

const ICONS = {
  blade: '<path d="M19 5 9.5 14.5" stroke-width="3.2"/><path d="m6.5 12.5 5 5"/><path d="M8.5 15.5 5 19"/>',
  flame: '<path fill="currentColor" stroke="none" d="M12 2.5c.6 3.6 5.5 5.6 5.5 11a5.5 5.5 0 0 1-11 0c0-2.2 1.1-3.7 2.3-5 .3 1.6 1.2 2.4 2.2 2.4C10.2 8.3 10.8 5.4 12 2.5z"/>',
  cinder: '<path fill="currentColor" stroke="none" d="m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3z"/>',
  crest: '<path fill="currentColor" stroke="none" d="M3 18.5v-11l5 4 4-6.5 4 6.5 5-4v11z"/>',
  wave: '<path d="M3 9c2.2-3 4.3-3 6.5 0s4.3 3 6.5 0 3-2 5-1"/><path d="M3 16c2.2-3 4.3-3 6.5 0s4.3 3 6.5 0 3-2 5-1"/>',
  shell: '<path fill="currentColor" stroke="none" d="M12 21 3.5 11a9 9 0 0 1 17 0z"/><path stroke="rgba(0,0,0,.35)" stroke-width="1.5" d="M12 21V6M12 21 7.5 8M12 21l4.5-13"/>',
  pearl: '<circle cx="12" cy="12" r="7.5" fill="currentColor" stroke="none"/><circle cx="9.5" cy="9.5" r="2" fill="rgba(255,255,255,.55)" stroke="none"/>',
  eye: '<path d="M2 12C5.5 6 18.5 6 22 12 18.5 18 5.5 18 2 12z"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6z"/>',
  snow: '<path d="M12 3v18M4.5 7.5l15 9M4.5 16.5l15-9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  up: '<path d="M12 20V5M6 11l6-6 6 6"/><path d="M5 20h14"/>',
  cards: '<rect x="6" y="3.5" width="12" height="17" rx="2.5"/><path d="M9.5 8h5"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.3" fill="currentColor" stroke="none"/>',
};
const SYMNAME = { blade: 'Blade', flame: 'Flame', cinder: 'Cinder', crest: 'Crest', wave: 'Wave', shell: 'Shell', pearl: 'Pearl', eye: 'Eye' };
const TYPE_LABEL = { main: 'Main', roll: 'Roll', instant: 'Instant', upgrade: 'Upgrade' };
const TYPE_INFO = {
  main: 'Main card: play it in your own main phases.',
  roll: 'Roll card: play it during a roll, yours or your opponent’s (attack or defense).',
  instant: 'Instant card: play it whenever the game is waiting on you, even on your opponent’s turn.',
  upgrade: 'Upgrade: play it in your main phase. It stays in play for the rest of the game.',
};

const GLOSS = {
  CP: 'Combat points, the energy you spend on cards. You start with 2, gain 1 at the start of each turn (the first player skips this on turn 1) and can hold up to 15. Sell a card for 1 CP in your main phases.',
  Sell: 'In your main phases, discard any card from your hand to gain 1 CP. At the end of your turn you must sell down to 6 cards.',
  Burn: 'Damage at the start of a burning hero’s turn equal to their Burn amount, ignoring Shield. Then Burn drops by 1. Maximum 3.',
  Chill: 'The chilled hero gets 1 fewer roll on their next offensive roll (2 instead of 3).',
  Shield: 'Soaks damage before health is touched. Stays until used up. Maximum 10. Ultimates ignore it.',
  Boost: 'Extra damage added to your attack this turn. Several Boosts stack. Defense, Shield and Parry can still reduce the hit.',
  Defense: 'When attacked, the defender rolls their hero’s defense dice once. The result can prevent damage or hit back.',
  Undefendable: 'This attack skips the defense roll. Shield and Instant cards like Parry still help.',
  Ultimate: 'Needs five of a hero’s rarest symbol. It cannot be defended, reduced or blocked by Shield, and no cards can answer it. Only changing a die before it is used can stop it.',
  Straight: 'Dice numbers in a row. A small straight is 4 in a row, like 2-3-4-5. A large straight is all 5 in a row: 1-2-3-4-5 or 2-3-4-5-6.',
  Upgrade: 'An Upgrade card permanently improves one ability. It stays in play for the rest of the game.',
};
const GLOSS_WORDS = { cp: 'CP', sell: 'Sell', burn: 'Burn', chill: 'Chill', chilled: 'Chill', shield: 'Shield', boost: 'Boost', defense: 'Defense', undefendable: 'Undefendable', ultimate: 'Ultimate', ultimates: 'Ultimate', straight: 'Straight', upgrade: 'Upgrade' };
function glossFor(text) {
  const seen = [];
  (text.match(/\b(CP|sell|burn|chill(?:ed)?|shield|boost|defense|undefendable|ultimates?|straight|upgrade)\b/gi) || []).forEach(w => {
    const k = GLOSS_WORDS[w.toLowerCase()]; if (k && seen.indexOf(k) < 0) seen.push(k);
  });
  return seen;
}
function glossHTML(keys) {
  return keys.length ? '<div class="gloss">' + keys.map(k => '<p><b>' + k + '</b> ' + GLOSS[k] + '</p>').join('') + '</div>' : '';
}

function ic(name, size, cls) {
  return '<svg class="ic' + (cls ? ' ' + cls : '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
}
function sigil(id, size) {
  const h = HEROES[id], g = id === 'ember' ? 'flame' : 'wave';
  return '<svg class="sigil" width="' + size + '" height="' + size + '" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 2.5 43 13.5v21L24 45.5 5 34.5v-21z" fill="' + h.color + '" fill-opacity=".16" stroke="' + h.color + '" stroke-width="2"/>' +
    '<svg x="10" y="10" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="' + h.color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:' + h.color + '">' + ICONS[g] + '</svg></svg>';
}

/* ---------- storage ---------- */
function loadRec() {
  try { const r = JSON.parse(localStorage.getItem('ashes-tides-rec') || 'null'); if (r && typeof r.w === 'number') return r; } catch (e) { /* storage unavailable */ }
  return { w: 0, l: 0, d: 0 };
}
function saveRec() { try { localStorage.setItem('ashes-tides-rec', JSON.stringify(ui.rec)); } catch (e) { /* storage unavailable */ } }
const SAVE_KEY = 'ashes-tides-save';
function readSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.v !== SAVE_VERSION || !s.g) return null;
    const G = restoreGame(s.g);
    if (G.phase === 'over') return null;
    return { G, hero: s.hero, at: s.at };
  } catch (e) { return null; }
}
function writeSave() {
  const G = ui.G;
  try {
    if (!G || ui.screen !== 'game' || G.phase === 'over') { localStorage.removeItem(SAVE_KEY); return; }
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: SAVE_VERSION, hero: ui.hero, at: Date.now(), g: serializeGame(G) }));
  } catch (e) { /* storage unavailable: play continues without saving */ }
}
function savedAgo(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (!t || m < 1) return 'just now';
  if (m < 60) return m + ' min ago';
  const h = Math.round(m / 60);
  if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
  const d = Math.round(h / 24);
  return d + (d === 1 ? ' day ago' : ' days ago');
}

const ui = { saved: null, screen: 'start', G: null, sel: null, selCard: null, target: null, rolling: new Set(), sheet: null, prevHp: [100, 100], fxSeen: 0, bannerSeen: 0, driving: false, recorded: false, rec: loadRec() };

/* ---------- small view helpers ---------- */
function reqHTML(ab, hero, faces) {
  if (ab.straight) {
    const set = new Set((faces || []).filter(f => f != null));
    const wins = ab.straight === 4 ? [[0, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5]] : [[0, 1, 2, 3, 4], [1, 2, 3, 4, 5]];
    const best = wins.reduce((b, w) => { const n = w.filter(v => set.has(v)).length; return n > b.n ? { w, n } : b; }, { w: wins[0], n: -1 });
    return '<span class="st">' + best.w.map(v => '<b class="' + (faces && set.has(v) ? 'have' : '') + '">' + (v + 1) + '</b>').join('') + '</span>';
  }
  const counts = faces ? symCounts(hero, faces.map(f => ({ face: f }))) : null;
  let out = '';
  Object.keys(ab.req).forEach(s => {
    const need = ab.req[s], have = counts ? (counts[s] || 0) : 0;
    for (let k = 0; k < need; k++) out += ic(s, 15, k < have ? 'have' : '');
  });
  return out;
}
function chip(cls, icon, label, key) { return '<button class="chip ' + cls + '" data-act="gloss" data-k="' + key + '" aria-label="' + key + ': what is this?">' + ic(icon, 13) + label + '</button>'; }
function abName(p, ab) { return ab.name + (level(p, ab.id) > 1 ? ' II' : ''); }
function abilityRows(p) {
  const hero = p.hero;
  return '<div class="abl" style="--hc:' + hero.color + '">' + hero.abilities.map(ab =>
    '<div class="abrow"><span class="nm">' + abName(p, ab) + (ab.ult ? ' <small class="ult">ULT</small>' : '') + '</span><span class="rq">' + reqHTML(ab, hero, null) + '</span><span class="ef">' + effText(abEff(p, ab)) + '</span></div>').join('') +
    '<div class="abrow"><span class="nm">' + hero.defense.name + (level(p, hero.defense.id) > 1 ? ' II' : '') + ' <small class="ult">DEFENSE</small></span><span class="rq">' + ic('dice', 15) + ' &times;' + defN(p) + '</span><span class="ef">' + hero.defense.text + '</span></div></div>';
}
function facesRow(hero) {
  return '<div class="facesrow" style="--ink:' + hero.ink + '">' + hero.faces.map((f, i) => '<span class="mf">' + ic(f, 22) + '<small>' + (i + 1) + '</small></span>').join('') + '</div>';
}
function defSummary(d) {
  const t = [];
  if (d.prevent) t.push('prevents ' + d.prevent);
  if (d.counter) t.push('strikes back for ' + d.counter);
  if (d.heal) t.push('heals ' + d.heal);
  if (d.burn) t.push('gives 1 Burn');
  return t.length ? t.join(', ') : 'no effect';
}
function showToast(text) {
  if (!text) return;
  $toast.textContent = text; $toast.classList.add('show');
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => $toast.classList.remove('show'), 2400);
}
const sleep = ms => new Promise(r => setTimeout(r, window.__fast ? 0 : ms));

/* ---------- start screen ---------- */
function continueView() {
  const s = ui.saved;
  if (!s) return '';
  const G = s.G, me = G.players[0], op = G.players[1];
  const whose = G.phase === 'defense' ? (G.pending.defender === 0 ? 'you are defending' : 'rival is defending') : G.active === 0 ? 'your turn' : 'rival&rsquo;s turn';
  return '<button class="resume" data-act="resume" style="--hc:' + me.hero.color + '">' +
    '<span class="rk">Duel in progress &middot; saved ' + savedAgo(s.at) + '</span>' +
    '<span class="rt">' + me.hero.name + ' <i>vs</i> ' + op.hero.name + '</span>' +
    '<span class="rs">Round ' + Math.ceil(G.turnNo / 2) + ' &middot; ' + whose + '</span>' +
    '<span class="rh"><b style="color:' + me.hero.color + '">You ' + me.hp + '</b><b style="color:' + op.hero.color + '">Rival ' + op.hp + '</b> HP</span>' +
    '<span class="go">Continue duel &rarr;</span></button>';
}
function startView() {
  const r = ui.rec;
  const card = id => {
    const h = HEROES[id], foe = HEROES[id === 'ember' ? 'brine' : 'ember'];
    return '<button class="hero" style="--hc:' + h.color + '" data-act="start" data-hero="' + id + '">' +
      '<div class="hh">' + sigil(id, 54) + '<div><div class="hn">' + h.name + '</div><div class="he">' + h.epithet + '</div></div></div>' +
      facesRow(h) + '<p class="hs">' + h.style + '</p>' +
      '<div class="go">Play ' + h.name.split(' ')[0] + ' against ' + foe.name.split(' ')[0] + ' &rarr;</div></button>';
  };
  return '<main class="start"><div><h1 class="logo">Ashes <span>&amp;</span> Tides</h1>' +
    '<p class="tag">Five dice, three rolls, one combo. Build your turn, spend your cards, outlast your rival.</p></div>' +
    continueView() +
    (ui.saved ? '<h3 class="newduel">Or start a new duel</h3>' : '') +
    '<div class="heroes">' + card('ember') + card('brine') + '</div>' +
    '<div class="start-foot"><button class="linkbtn" data-act="rules">How a turn works</button><span class="rec">Record ' + r.w + '&ndash;' + r.l + (r.d ? '&ndash;' + r.d : '') + '</span></div>' +
    '<p class="proto">A dice duel with original heroes, cards and art. You play against an AI opponent. <span class="ver">Version ' + GAME_VERSION + '</span></p></main>' +
    (ui.sheet ? sheetView() : '');
}

/* ---------- game screen ---------- */
function panelView(pi) {
  const G = ui.G, p = G.players[pi], h = p.hero;
  const pct = Math.min(100, Math.round(100 * p.hp / START_HP)), prev = ui.prevHp[pi];
  ui.prevHp[pi] = pct;
  const active = G.active === pi && G.phase !== 'over';
  const chips = (p.shield ? chip('shield', 'shield', 'Shield ' + p.shield, 'Shield') : '') + (p.burn ? chip('burn', 'flame', 'Burn ' + p.burn, 'Burn') : '') +
    (p.chill ? chip('chill', 'snow', 'Chill', 'Chill') : '') + (p.bonusDmg ? chip('boost', 'blade', 'Boost +' + p.bonusDmg, 'Boost') : '');
  const ups = p.inPlay.length ? ' &middot; ' + p.inPlay.length + ' upgrade' + (p.inPlay.length > 1 ? 's' : '') : '';
  return '<section class="panel ' + (pi === 1 ? 'opp' : 'me') + (active ? ' active' : '') + '" id="panel' + pi + '" style="--hc:' + h.color + '"' + (pi === 1 ? ' data-act="infoOpp"' : '') + '>' +
    '<div class="p-top">' + sigil(h.id, 34) + '<div class="p-id"><div class="p-name">' + h.name + '</div><div class="p-sub">' + (pi === 0 ? 'You' : 'Opponent &middot; round ' + Math.ceil(G.turnNo / 2)) + (active ? (pi === 0 ? ' &middot; your turn' : ' &middot; their turn') : '') + '</div></div><div class="chips">' + chips + '</div></div>' +
    '<div class="hpbar" role="img" aria-label="Health ' + p.hp + ' of ' + START_HP + '"><i class="hpfill" style="width:' + prev + '%" data-to="' + pct + '%"></i><b class="hpnum">' + p.hp + '<small>/' + START_HP + '</small></b></div>' +
    '<div class="p-bot"><button class="cp" data-act="gloss" data-k="CP" aria-label="' + p.cp + ' combat points: what is this?"><span class="cpbar"><i style="width:' + Math.round(100 * p.cp / MAX_CP) + '%"></i></span><span class="cpn">' + p.cp + ' CP</span></button>' +
    '<div>' + (pi === 1 ? 'Hand ' + p.hand.length + ' &middot; ' : '') + 'Deck ' + p.deck.length + ups + '</div></div></section>';
}
function logView() {
  const G = ui.G, last = G.log.slice(-2);
  return '<div class="logrow"><button class="logline" data-act="log" aria-label="Open history">' + last.map(l => '<span>' + l.t + '</span>').join('') + '</button><button class="menubtn hist-btn" data-act="log">History</button><button class="menubtn" data-act="menu">Menu</button></div>';
}
function trayModel(G) {
  if (G.phase === 'defense' && G.pending && G.pending.def) {
    const def = G.pending.def, owner = G.pending.defender;
    return { owner, def: true, dice: def.rolled ? def.dice : Array.from({ length: def.n }, () => ({ face: null })), skip: def.skip };
  }
  return { owner: G.active, def: false, dice: G.dice };
}
function trayView() {
  const G = ui.G, tm = trayModel(G), owner = G.players[tm.owner], h = owner.hero;
  const me0 = actor(G) === 0;
  const canHold = me0 && !tm.def && G.phase === 'roll' && G.rolled > 0 && G.rollsLeft > 0 && !ui.target && !G.prompt;
  const tgt = !!(ui.target && ui.target.stage === 'dice');
  /* while you can answer the rival's roll, each die shows how often rerolling it works in your favour */
  const odds = G.prompt && G.prompt.pi === 0 && tm.owner === 1 ? rerollOdds(G) : null;
  const best = odds ? Math.max.apply(null, odds) : 0;
  const dice = tm.dice.map((d, i) => {
    const sym = d.face == null ? null : h.faces[d.face];
    const held = d.held && !odds, o = odds ? odds[i] : 0;
    const cls = 'die' + (sym ? '' : ' blank') + (held ? ' held' : '') + (ui.rolling.has(i) ? ' tumble' : '') + (tgt && sym ? ' tgt' : '') + (tgt && ui.target.picks.indexOf(i) >= 0 ? ' pick' : '') + (o && o === best ? ' key' : '');
    const live = canHold || (tgt && sym);
    return '<button class="' + cls + '" data-act="die" data-i="' + i + '"' + (live ? '' : ' disabled') + ' aria-label="Die ' + (i + 1) + (sym ? ', ' + SYMNAME[sym] + ' ' + (d.face + 1) : ', not rolled') + (held ? ', kept' : '') + (odds ? ', a reroll helps you ' + o + ' times in 6' : '') + '">' +
      (sym ? ic(sym, 40) + '<span class="num">' + (d.face + 1) + '</span>' : '') + (held ? '<span class="keep">KEEP</span>' : '') + (odds ? '<span class="odds">' + o + '/6</span>' : '') + '</button>';
  }).join('');
  const whoTxt = tm.owner === 0 ? 'Your' : 'Rival&rsquo;s';
  let label = whoTxt + ' dice', pips = '';
  if (tm.def) label = whoTxt + ' defense &middot; ' + h.defense.name + (tm.skip ? ' (skipped)' : ' &middot; ' + tm.dice.length + ' dice, 1 roll');
  else if (G.phase === 'roll') { for (let k = 0; k < 3; k++) pips += '<i class="pip' + (k < G.rollsLeft ? ' on' : '') + '"></i>'; }
  return '<section class="table' + (tm.def ? ' defmode' : '') + '" style="--dink:' + h.ink + ';--hc:' + h.color + '">' + stepsView() +
    '<div class="tlabel"><span>' + label + '</span><span class="pips" aria-label="Rolls left">' + pips + '</span></div>' +
    '<div class="dice">' + dice + '</div>' + actionsView() + '</section>';
}
function stepsView() {
  const G = ui.G;
  if (G.phase === 'over') return '';
  const nav = G.rolled > 0 ? availableAbilities(G, G.active).length : 0;
  let cur = { main1: 0, defense: 2, main2: 3, discard: 3 }[G.phase];
  if (G.phase === 'roll') cur = G.rolled > 0 && (nav > 0 || G.rollsLeft <= 0) ? 2 : 1;
  const names = ['Cards', 'Roll', 'Ability', 'End'];
  return '<ol class="steps" aria-label="' + (G.active === 0 ? 'Your' : 'Rival’s') + ' turn steps">' + names.map((n, i) => '<li class="' + (i === cur ? 'cur' : i < cur ? 'done' : '') + '"' + (i === cur ? ' aria-current="step"' : '') + '><b>' + (i + 1) + '</b>' + n + '</li>').join('') + '</ol>';
}
function waitView() {
  const G = ui.G;
  let t = 'Rival is thinking…';
  if (G.prompt) t = 'Rival is deciding whether to respond…';
  else if (G.phase === 'defense') t = G.pending.def.rolled || G.pending.def.skip ? 'Rival is deciding on their defense…' : 'Rival is rolling defense…';
  else if (G.phase === 'roll') t = G.rolled ? 'Rival is choosing…' : 'Rival is rolling…';
  else if (G.phase === 'main1' || G.phase === 'main2') t = 'Rival is playing cards…';
  else if (G.phase === 'discard') t = 'Rival is selling cards…';
  return '<div class="actions wait">' + t + '</div>';
}
function respondCards(G) {
  const me = G.players[0];
  return me.hand.map((id, i) => ({ id, i })).filter(x => CARDS[x.id].target && CARDS[x.id].target.who === 'opp' && canPlay(G, 0, x.i).ok);
}
function promptView() {
  const G = ui.G, pr = G.prompt, opp = G.players[1];
  let msg;
  if (pr.kind === 'respond') {
    const ab = opp.hero.abilities.find(a => a.id === pr.abId);
    msg = 'Rival is about to use <b>' + abName(opp, ab) + '</b>' + (ab.ult ? ' (Ultimate)' : '') + ': ' + effText(abEff(opp, ab), opp.bonusDmg) + ', needing ' + reqText(ab) + '. You can change one of their dice first. ' +
      'Under each die: how often a reroll breaks it.';
  } else {
    msg = 'Rival defends with <b>' + opp.hero.defense.name + '</b>: it ' + defSummary(defenseOutcome(G)) + '. You can change one of their defense dice. ' +
      'Under each die: how often a reroll weakens their defense.';
  }
  const btns = respondCards(G).map(x => '<button class="btn" data-act="quickplay" data-i="' + x.i + '">' + CARDS[x.id].name + ' <span class="n">' + CARDS[x.id].cost + ' CP</span></button>').join('');
  return '<p class="msg">' + msg + '</p><div class="actions">' + btns + '<button class="btn primary" data-act="pass">' + (pr.kind === 'respond' ? 'Let it happen' : 'Continue') + '</button></div>';
}
function defenseView() {
  const G = ui.G, pend = G.pending, def = pend.def, me = G.players[0], att = G.players[pend.attacker];
  const m = hitMath(G), incoming = m.base + m.bonus;
  if (def.skip) {
    return '<p class="msg"><b>' + pend.name + '</b> is undefendable, so you can&rsquo;t roll defense. You will take <b>' + m.hp + '</b>.</p>' +
      '<div class="actions"><button class="btn primary" data-act="defconfirm">Take ' + m.hp + ' damage</button></div><p class="hint">Instant cards like Parry still work: tap one in your hand.</p>';
  }
  if (!def.rolled) {
    return '<p class="msg">' + att.hero.name + ' attacks with <b>' + pend.name + '</b> for <b>' + incoming + '</b>. Roll your defense, <b>' + me.hero.defense.name + '</b>: ' + me.hero.defense.text + '</p>' +
      '<div class="actions"><button class="btn primary" data-act="defroll">Roll defense ' + ic('dice', 20) + ' <span class="n">' + def.n + ' dice</span></button></div>';
  }
  return '<p class="msg">' + me.hero.defense.name + ' ' + defSummary(defenseOutcome(G)) + '. You take <b>' + m.hp + '</b> of ' + incoming + '.</p>' +
    '<div class="actions"><button class="btn primary" data-act="defconfirm">Confirm defense</button></div><p class="hint">You can still play a Roll card on your defense dice, or an Instant card.</p>';
}
function actionsView() {
  const G = ui.G;
  if (G.phase === 'over') return '';
  if (ui.target) return targetBarView();
  if (actor(G) !== 0) return waitView();
  if (G.prompt) return promptView();
  if (G.phase === 'defense') return defenseView();
  if (G.phase === 'main1') {
    const n = G.players[0].hand.filter((id, i) => canPlay(G, 0, i).ok).length;
    return '<div class="actions"><button class="btn primary" data-act="rollstart">Roll dice ' + ic('dice', 20) + '</button></div><p class="hint">' +
      (n ? 'You can play ' + n + ' card' + (n > 1 ? 's' : '') + ' first, or sell cards for CP. Tap a card. Or just roll.' : 'Roll the dice, or tap a card to sell it for 1 CP.') + '</p>';
  }
  if (G.phase === 'roll') {
    const left = G.rollsLeft, av = G.rolled > 0 ? availableAbilities(G, 0) : [];
    let use = '';
    if (G.rolled > 0) {
      const ab = av.find(x => x.id === ui.sel);
      if (ab) use = '<button class="btn primary" data-act="use">Use ' + abName(G.players[0], ab) + '</button>';
      else if (!av.length && left <= 0) use = '<button class="btn primary" data-act="skipab">No ability. Continue</button>';
    }
    const rollBtn = '<button class="btn' + (G.rolled === 0 ? ' primary' : '') + '" data-act="roll"' + (left <= 0 ? ' disabled' : '') + '>' + (G.rolled === 0 ? 'Roll dice' : 'Reroll') + ' <span class="n">' + left + ' left</span></button>';
    const hint = G.rolled === 0 ? 'Roll all five dice. You get up to 3 rolls.' : left > 0 ? (av.length ? 'Gold abilities are ready. Use one now, or tap dice to keep them and reroll.' : 'Nothing matches yet. Tap the dice you want to keep, then reroll.') : (av.length ? 'No rolls left. Pick an ability.' : 'No rolls left and nothing matches.');
    return '<div class="actions">' + rollBtn + use + '</div><p class="hint">' + hint + '</p>';
  }
  if (G.phase === 'main2') return '<div class="actions"><button class="btn primary" data-act="endturn">End turn</button></div><p class="hint">Play more cards, or sell cards you don&rsquo;t need for 1 CP each.</p>';
  if (G.phase === 'discard') {
    const extra = G.players[0].hand.length - HAND_LIMIT;
    return '<p class="msg">Your hand is over the limit of ' + HAND_LIMIT + '. Sell <b>' + extra + '</b> more card' + (extra > 1 ? 's' : '') + ' for 1 CP each: tap a card, then Sell.</p>';
  }
  return '';
}
function targetBarView() {
  const G = ui.G, t = ui.target, c = CARDS[G.players[0].hand[t.idx]], ls = liveSet(G);
  if (t.stage === 'face') {
    const h = G.players[ls.owner].hero;
    const btns = h.faces.map((s, fi) => '<button class="fbtn" data-act="face" data-f="' + fi + '" aria-label="' + SYMNAME[s] + ' ' + (fi + 1) + '">' + ic(s, 26) + '<small>' + (fi + 1) + '</small></button>').join('');
    return '<div class="tbar"><p class="hint">' + c.name + ': set die ' + (t.picks[0] + 1) + ' to</p><div class="faces-pick">' + btns + '</div><div class="actions"><button class="btn" data-act="cancelTarget">Cancel</button></div></div>';
  }
  const max = c.target.kind === 'face' ? 1 : (c.target.max || 1);
  const whose = c.target.who === 'opp' ? 'one of your rival&rsquo;s dice' : (max > 1 ? 'up to ' + max + ' of your dice' : 'one of your dice');
  return '<div class="tbar"><p class="hint">' + c.name + ': tap ' + whose + '.</p><div class="actions">' +
    (max > 1 ? '<button class="btn primary" data-act="confirmTarget"' + (t.picks.length ? '' : ' disabled') + '>Reroll ' + (t.picks.length || '') + '</button>' : '') +
    '<button class="btn" data-act="cancelTarget">Cancel</button></div></div>';
}
/* while the rival rolls to attack, show their abilities against their dice instead of yours */
function rivalAbilitiesView() {
  const G = ui.G, op = G.players[1], h = op.hero, faces = G.dice.map(d => d.face);
  const announced = G.prompt && G.prompt.kind === 'respond' ? G.prompt.abId : null;
  /* the ability they announced first, then the others their dice already match */
  const rank = ab => ab.id === announced ? 0 : faceMet(h, ab, faces) ? 1 : 2;
  const list = h.abilities.slice().sort((a, b) => rank(a) - rank(b));
  return '<section class="abilities rival" data-keep="ab-rival-' + (announced || '') + '" style="--hc:' + h.color + '" aria-label="Rival’s abilities"><p class="abtag">Rival&rsquo;s abilities</p>' + list.map(ab => {
    const ok = faceMet(h, ab, faces), lv = level(op, ab.id);
    return '<button class="ab live' + (ok ? ' ok' : '') + (ab.id === announced ? ' sel' : '') + (lv > 1 ? ' up' : '') + '" data-act="infoOpp">' +
      '<span class="nm">' + ab.name + (lv > 1 ? '<i>II</i>' : '') + (ab.ult ? '<i>ULT</i>' : '') + '</span><span class="rq">' + reqHTML(ab, h, faces) + '</span><span class="ef">' + effText(abEff(op, ab), op.bonusDmg) + '</span></button>';
  }).join('') + '</section>';
}
function abilitiesView() {
  const G = ui.G, me = G.players[0], h = me.hero;
  if (G.phase === 'roll' && G.active === 1 && G.rolled > 0) return rivalAbilitiesView();
  const live = G.phase === 'roll' && G.active === 0 && G.rolled > 0;
  const faces = live ? G.dice.map(d => d.face) : null;
  const av = live ? availableAbilities(G, 0).map(a => a.id) : [];
  const defLv = level(me, h.defense.id);
  return '<section class="abilities" data-keep="ab" style="--hc:' + h.color + '" aria-label="Your abilities">' + h.abilities.map(ab => {
    const ok = av.indexOf(ab.id) >= 0, lv = level(me, ab.id);
    return '<button class="ab' + (live ? ' live' : '') + (ok ? ' ok' : '') + (ui.sel === ab.id && ok ? ' sel' : '') + (lv > 1 ? ' up' : '') + '" data-act="ab" data-id="' + ab.id + '">' +
      '<span class="nm">' + ab.name + (lv > 1 ? '<i>II</i>' : '') + (ab.ult ? '<i>ULT</i>' : '') + '</span><span class="rq">' + reqHTML(ab, h, faces) + '</span><span class="ef">' + effText(abEff(me, ab), me.bonusDmg) + '</span></button>';
  }).join('') +
    '<button class="ab def" data-act="defab"><span class="nm">' + h.defense.name + (defLv > 1 ? '<i>II</i>' : '') + '<i>DEF</i></span><span class="rq">' + ic('dice', 15) + ' &times;' + defN(me) + '</span><span class="ef">Defense roll when attacked</span></button>' +
    '</section>';
}
function handView() {
  const G = ui.G, me = G.players[0];
  const discarding = G.phase === 'discard' && G.active === 0;
  const cards = me.hand.map((id, i) => {
    const c = CARDS[id], pl = canPlay(G, 0, i);
    return '<button class="card t-' + c.type + (ui.selCard === i ? ' sel' : '') + (pl.ok || discarding ? '' : ' dim') + '" data-act="card" data-i="' + i + '">' +
      '<span class="ci">' + ic(c.icon, 20) + '</span><span class="cc">' + c.cost + '</span><span class="cn">' + c.name + '</span><span class="ct">' + c.text + '</span><span class="cw">' + TYPE_LABEL[c.type] + '</span></button>';
  }).join('');
  return '<section class="handwrap"><div class="hand" data-keep="hand" aria-label="Your hand">' + (cards || '<p class="hint" style="padding:30px 0;flex:1">No cards in hand. You draw one each turn.</p>') + '</div></section>';
}
function cardSheetView() {
  const G = ui.G, me = G.players[0], i = ui.selCard, c = CARDS[me.hand[i]], pl = canPlay(G, 0, i), sl = canSell(G, 0);
  const discarding = G.phase === 'discard' && G.active === 0;
  const play = pl.ok ? '<button class="btn primary" data-act="playcard">Play for ' + c.cost + ' CP</button>' : (discarding ? '' : '<button class="btn" disabled>Can&rsquo;t play now</button>');
  const sell = sl.ok ? '<button class="btn' + (discarding ? ' primary' : '') + '" data-act="sell">Sell for 1 CP</button>' : '';
  return '<div class="back" data-act="closeCard"></div><div class="sheet"><div class="in"><div class="cardhead t-' + c.type + '"><span class="ci">' + ic(c.icon, 26) + '</span><h2>' + c.name + '</h2><span class="cc big">' + c.cost + ' CP</span></div>' +
    '<p class="tline t-' + c.type + '">' + TYPE_INFO[c.type] + '</p>' +
    '<p class="cardtext">' + c.text + '</p>' + glossHTML(glossFor(c.text)) +
    (pl.ok || discarding ? '' : '<p class="why">' + pl.why + '</p>') +
    '<div class="actions">' + play + sell + '<button class="btn" data-act="closeCard">Close</button></div></div></div>';
}
function historyList() {
  const G = ui.G, groups = [];
  let cur = { start: true, items: [] };
  groups.push(cur);
  G.log.forEach(l => {
    if (l.kind === 'turn') { cur = { head: l, items: [] }; groups.push(cur); }
    else cur.items.push(l);
  });
  const ev = l => {
    const pl = l.who >= 0 ? G.players[l.who] : null;
    let dice = '';
    if (l.dice && pl) dice = '<div class="dd" style="--ink:' + pl.hero.ink + '">' + l.dice.map(f => f == null ? '' : '<i>' + ic(pl.hero.faces[f], 16) + '<small>' + (f + 1) + '</small></i>').join('') +
      '<small>' + (l.def ? 'defense roll' : l.rolls + (l.rolls === 1 ? ' roll' : ' rolls')) + '</small></div>';
    return '<li class="ev' + (l.dice ? ' big' : '') + (l.who < 0 ? ' sys' : '') + '">' + l.t + dice + '</li>';
  };
  const html = groups.slice().reverse().map(g => {
    if (g.start) return g.items.length ? '<section class="turn" style="--hc:var(--muted)"><h4>Setup</h4><ul>' + g.items.map(ev).join('') + '</ul></section>' : '';
    const pi = g.head.who, h = G.players[pi].hero, hp = g.head.hp;
    return '<section class="turn" style="--hc:' + h.color + '"><h4>Round ' + Math.ceil(g.head.turn / 2) + ' &middot; ' + (pi === 0 ? 'Your turn' : h.name) +
      '<span>You ' + hp[0] + ' &middot; Rival ' + hp[1] + ' HP</span></h4><ul>' + (g.items.length ? g.items.map(ev).join('') : '<li class="ev sys">Nothing yet.</li>') + '</ul></section>';
  }).join('');
  return '<div class="hist">' + html + '</div>';
}
function historyView() {
  return '<div class="sheethead"><h2>History</h2><button class="btn small" data-act="closeSheet">Close</button></div>' +
    '<p class="when">Newest turn at the top. Health is shown as it was when each turn began.</p>' + historyList();
}
function sideView() {
  return '<aside class="side" data-keep="side" aria-label="History"><div class="sidehead"><h3>History</h3><span>Newest first</span></div>' + historyList() + '</aside>';
}
function rulesBody(welcome) {
  return '<h2>' + (welcome ? 'Welcome. Here is your turn' : 'How a turn works') + '</h2>' +
    '<p>Take your rival from ' + START_HP + ' health to zero. A die roll-off decides who goes first. The four steps of each turn are shown above the dice.</p><ol>' +
    '<li><b>Cards.</b> Gain 1 CP and draw a card (the first player skips this on turn 1). Play Main cards and Upgrades, or sell any card for 1 CP.</li>' +
    '<li><b>Roll.</b> Roll five dice, up to 3 times. Tap a die to KEEP it, then reroll the rest. Roll cards can change dice.</li>' +
    '<li><b>Ability.</b> Abilities glow gold when your dice match. Press Use. Your rival rolls their defense once, and either of you may answer with cards.</li>' +
    '<li><b>End.</b> Play or sell more cards, then end your turn. Hold 6 cards at most: sell the rest.</li></ol>' +
    '<h3>Card types</h3><ul class="types"><li class="t-main"><b>Main</b> your main phases</li><li class="t-roll"><b>Roll</b> during any roll, yours or your rival&rsquo;s</li><li class="t-instant"><b>Instant</b> whenever the game waits on you</li><li class="t-upgrade"><b>Upgrade</b> improves an ability for good</li></ul>' +
    '<h3>Words to know</h3>' + glossHTML(['CP', 'Defense', 'Ultimate', 'Undefendable', 'Straight', 'Shield', 'Burn', 'Chill']);
}
function sheetView() {
  const G = ui.G;
  if (G && ui.screen === 'game' && G.phase === 'over' && ui.sheet !== 'log') {
    const won = G.winner === 0, draw0 = G.winner === -1;
    return '<div class="back"></div><div class="sheet"><div class="in over"><h2 class="' + (won ? 'win' : draw0 ? '' : 'lose') + '">' + (won ? 'Victory' : draw0 ? 'Draw' : 'Defeat') + '</h2>' +
      '<p>' + (won ? 'You outlasted ' + G.players[1].hero.name + ' in ' + Math.ceil(G.turnNo / 2) + ' rounds.' : draw0 ? 'Both heroes fell at the same moment.' : G.players[1].hero.name + ' wins after ' + Math.ceil(G.turnNo / 2) + ' rounds.') + '</p>' +
      '<div class="actions"><button class="btn primary" data-act="rematch">Rematch</button><button class="btn" data-act="home">Change hero</button></div><button class="linkbtn" data-act="log">See what happened</button></div></div>';
  }
  if (G && ui.screen === 'game' && ui.selCard != null && G.players[0].hand[ui.selCard]) return cardSheetView();
  if (!ui.sheet) return '';
  const close = '<div class="actions"><button class="btn" data-act="closeSheet">Close</button></div>';
  let body = '';
  if (ui.sheet === 'gloss') {
    body = '<h2>' + ui.glossKey + '</h2><p class="cardtext">' + GLOSS[ui.glossKey] + '</p>' + close;
  } else if (ui.sheet === 'ability') {
    const me = G.players[0], hero = me.hero, ab = hero.abilities.find(a => a.id === ui.abId), eff = abEff(me, ab);
    const next = ab.lv.length > level(me, ab.id) ? '<p class="when">Upgrade to level II: ' + effText(ab.lv[1]) + '.</p>' : '';
    body = '<h2>' + abName(me, ab) + '</h2><div class="rq big" style="--hc:' + hero.color + '">' + reqHTML(ab, hero, null) + '</div>' +
      '<p class="cardtext">' + effText(eff) + '</p><p class="when">Needs ' + reqText(ab) + ' on your dice.</p>' + next +
      glossHTML(glossFor(effText(eff) + (ab.ult ? ' ultimate' : '') + (ab.straight ? ' straight' : ''))) + close;
  } else if (ui.sheet === 'defense') {
    const me = G.players[0], d = me.hero.defense;
    body = '<h2>' + d.name + (level(me, d.id) > 1 ? ' II' : '') + '</h2><p class="cardtext">' + d.text + '</p><p class="when">When you are attacked, roll ' + defN(me) + ' dice once.' + (level(me, d.id) < 2 ? ' Its upgrade raises this to ' + d.lv[1].n + ' dice.' : '') + '</p>' +
      glossHTML(['Defense', 'Undefendable', 'Ultimate']) + close;
  } else if (ui.sheet === 'rules' || ui.sheet === 'welcome') {
    body = rulesBody(ui.sheet === 'welcome') + (ui.sheet === 'welcome' ? '<div class="actions"><button class="btn primary" data-act="closeSheet">Let&rsquo;s play</button></div>' : close);
  } else if (ui.sheet === 'opp') {
    const op = G.players[1], h = op.hero;
    body = '<h2>' + h.name + '</h2><p>' + h.style + '</p><h3>Dice faces</h3>' + facesRow(h) + '<h3>Abilities</h3>' + abilityRows(op) +
      (op.inPlay.length ? '<h3>Upgrades in play</h3><p>' + op.inPlay.map(id => CARDS[id].name).join(', ') + '</p>' : '') +
      '<h3>Words to know</h3>' + glossHTML(['Defense', 'Ultimate', 'Undefendable', 'Straight', 'Burn', 'Chill']) + close;
  } else if (ui.sheet === 'log') {
    body = historyView();
  } else if (ui.sheet === 'menu') {
    body = '<h2>Menu</h2><div class="menulist"><button class="btn" data-act="log">History</button><button class="btn" data-act="rules">How a turn works</button><button class="btn" data-act="infoOpp">Opponent&rsquo;s abilities</button><button class="btn" data-act="rematch">Restart duel</button><button class="btn" data-act="home">Leave to title screen</button></div><p class="when">Your duel is saved after every move. You can close the page and continue later.</p><p class="when ver">Version ' + GAME_VERSION + '</p>' + close;
  }
  return '<div class="back" data-act="closeSheet"></div><div class="sheet" data-keep="sheet-' + ui.sheet + '"><div class="in">' + body + '</div></div>';
}
function gameView() {
  return '<div class="game">' + panelView(1) + logView() + trayView() + abilitiesView() + panelView(0) + handView() + sideView() + sheetView() + '</div>';
}

/* ---------- render ---------- */
function render() {
  const keep = {};
  $app.querySelectorAll('[data-keep]').forEach(el => { keep[el.dataset.keep] = [el.scrollLeft, el.scrollTop]; });
  $app.innerHTML = ui.screen === 'start' ? startView() : gameView();
  $app.querySelectorAll('[data-keep]').forEach(el => { const k = keep[el.dataset.keep]; if (k) { el.scrollLeft = k[0]; el.scrollTop = k[1]; } });
  requestAnimationFrame(() => { $app.querySelectorAll('.hpfill').forEach(el => { el.style.width = el.dataset.to; }); });
  spawnFx();
}
function spawnFx() {
  const G = ui.G; if (!G || ui.screen !== 'game') return;
  while (ui.fxSeen < G.fx.length) {
    const f = G.fx[ui.fxSeen++], host = document.getElementById('panel' + f.pi);
    if (!host) continue;
    const s = document.createElement('span');
    s.className = 'fxnum ' + f.type;
    s.textContent = f.type === 'cp' ? '+' + f.n + ' CP' : (f.type === 'dmg' || f.type === 'burn' ? '−' : '+') + f.n;
    host.appendChild(s); s.addEventListener('animationend', () => s.remove());
  }
}
function setRolling(list) {
  ui.rolling = new Set(list || []);
  setTimeout(() => { ui.rolling = new Set(); }, 600);
}
function autoSelect() {
  const G = ui.G;
  if (!G || G.phase !== 'roll' || G.active !== 0 || G.rolled === 0) { ui.sel = null; return; }
  const me = G.players[0], av = availableAbilities(G, 0);
  if (!av.length) { ui.sel = null; return; }
  if (ui.sel && av.some(a => a.id === ui.sel)) return;
  const sc = a => scoreEff(G, 0, abEff(me, a), me.bonusDmg, a.ult);
  ui.sel = av.reduce((b, a) => sc(a) > sc(b) ? a : b).id;
}
function sync() {
  const G = ui.G; if (!G) return;
  writeSave();
  if (G.bannerSeq !== ui.bannerSeen) { ui.bannerSeen = G.bannerSeq; showToast(G.banner); }
  if (ui.target && (actor(G) !== 0 || !liveSet(G) || !G.players[0].hand[ui.target.idx])) ui.target = null;
  if (ui.selCard != null && !G.players[0].hand[ui.selCard]) ui.selCard = null;
  autoSelect();
  if (G.phase === 'over' && !ui.recorded) {
    ui.recorded = true;
    if (G.winner === 0) ui.rec.w++; else if (G.winner === 1) ui.rec.l++; else ui.rec.d++;
    saveRec();
  }
}
function needsAI(G) { const a = actor(G); return a >= 0 && !G.players[a].human; }
async function drive() {
  if (ui.driving) return;
  ui.driving = true;
  try {
    for (;;) {
      const G = ui.G;
      if (!G || !needsAI(G)) break;
      await sleep(G.prompt ? 700 : G.phase === 'defense' ? 1000 : G.phase === 'roll' && G.rolled > 0 ? 1100 : 750);
      if (ui.G !== G || !needsAI(G)) break;
      const r = aiAct(G);
      if (!r) break;
      if (r.rolled) setRolling(r.rolled);
      sync(); render();
    }
  } finally { ui.driving = false; }
}
function after() { sync(); render(); drive(); }

function resumeGame() {
  const s = readSave();
  if (!s) { ui.saved = null; showToast('That saved duel could not be loaded.'); render(); return; }
  ui.G = s.G; ui.hero = s.hero || s.G.players[0].hero.id;
  ui.screen = 'game'; ui.sel = null; ui.selCard = null; ui.target = null; ui.sheet = null; ui.rolling = new Set();
  ui.prevHp = s.G.players.map(p => Math.min(100, Math.round(100 * p.hp / START_HP))); ui.fxSeen = 0; ui.bannerSeen = s.G.bannerSeq; ui.recorded = false; ui.welcomed = true;
  ui.saved = null;
  after();
  showToast('Welcome back. Round ' + Math.ceil(s.G.turnNo / 2) + '.');
}
function startGame(heroId) {
  const foe = heroId === 'ember' ? 'brine' : 'ember';
  ui.G = newGame({ heroes: [heroId, foe], humans: [true, false] });
  ui.screen = 'game'; ui.sel = null; ui.selCard = null; ui.target = null; ui.sheet = null; ui.rolling = new Set();
  ui.prevHp = [100, 100]; ui.fxSeen = ui.G.fx.length; ui.bannerSeen = ui.G.bannerSeq - 1; ui.recorded = false; ui.hero = heroId;
  let seen = ui.welcomed;
  try { seen = seen || localStorage.getItem('ashes-tides-seen2') === '1'; localStorage.setItem('ashes-tides-seen2', '1'); } catch (e) { /* storage unavailable */ }
  ui.welcomed = true;
  if (!seen) ui.sheet = 'welcome';
  after();
}
function beginPlay(i) {
  const G = ui.G, chk = canPlay(G, 0, i);
  if (!chk.ok) { showToast(chk.why); return; }
  const c = CARDS[G.players[0].hand[i]];
  ui.selCard = null;
  if (c.target) ui.target = { idx: i, stage: 'dice', picks: [] };
  else playCard(G, 0, i, {});
}
function playTargeted(arg) {
  const G = ui.G, t = ui.target;
  const r = playCard(G, 0, t.idx, arg);
  ui.target = null; ui.selCard = null;
  if (!r.ok) showToast(r.why); else setRolling(arg.dice);
  after();
}

/* ---------- input ---------- */
$app.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const ds = el.dataset, G = ui.G;
  switch (ds.act) {
    case 'start': startGame(ds.hero); return;
    case 'resume': resumeGame(); return;
    case 'rules': ui.sheet = 'rules'; render(); return;
    case 'menu': ui.sheet = 'menu'; render(); return;
    case 'log': ui.sheet = 'log'; render(); return;
    case 'infoOpp': ui.sheet = 'opp'; render(); return;
    case 'closeSheet': ui.sheet = null; render(); return;
    case 'gloss': e.stopPropagation(); ui.glossKey = ds.k; ui.sheet = 'gloss'; render(); return;
    case 'defab': ui.sheet = 'defense'; render(); return;
    case 'rematch': startGame(ui.hero); return;
    case 'home': ui.screen = 'start'; ui.sheet = null; ui.saved = readSave(); ui.G = null; render(); return;
  }
  if (!G) return;
  switch (ds.act) {
    case 'rollstart': if (actor(G) === 0 && G.phase === 'main1') { toRollPhase(G); const r = rollDice(G); if (r) setRolling(r); } break;
    case 'roll': if (actor(G) === 0) { const r = rollDice(G); if (r) setRolling(r); } break;
    case 'die': {
      const i = +ds.i;
      if (ui.target) {
        const t = ui.target, ls = liveSet(G);
        if (t.stage !== 'dice' || !ls || !ls.dice[i] || ls.dice[i].face == null) return;
        const c = CARDS[G.players[0].hand[t.idx]], max = c.target.kind === 'face' ? 1 : (c.target.max || 1);
        const pos = t.picks.indexOf(i);
        if (pos >= 0) t.picks.splice(pos, 1); else t.picks.push(i);
        if (t.picks.length > max) t.picks.shift();
        if (c.target.kind === 'face') { if (t.picks.length) t.stage = 'face'; }
        else if (max === 1 && t.picks.length) { playTargeted({ dice: t.picks.slice() }); return; }
      } else toggleHold(G, i);
      break;
    }
    case 'ab': {
      const ok = G.phase === 'roll' && G.active === 0 && G.rolled > 0 && availableAbilities(G, 0).some(a => a.id === ds.id);
      if (ok && ui.sel !== ds.id) ui.sel = ds.id;
      else { ui.abId = ds.id; ui.sheet = 'ability'; }
      break;
    }
    case 'use': if (ui.sel && actor(G) === 0) { const id = ui.sel; ui.sel = null; requestActivate(G, id); } break;
    case 'skipab': if (actor(G) === 0) requestActivate(G, null); break;
    case 'pass': if (G.prompt && G.prompt.pi === 0) passPrompt(G); break;
    case 'defroll': { const r = rollDefense(G); if (r) setRolling(r); break; }
    case 'defconfirm': if (actor(G) === 0) confirmDefense(G); break;
    case 'endturn': endTurn(G); break;
    case 'card': if (ui.target) { showToast('Pick a die first, or cancel.'); break; } ui.selCard = +ds.i; ui.sheet = null; break;
    case 'closeCard': ui.selCard = null; break;
    case 'playcard': if (ui.selCard != null) beginPlay(ui.selCard); break;
    case 'quickplay': beginPlay(+ds.i); break;
    case 'sell': if (ui.selCard != null) { const r = sellCard(G, 0, ui.selCard); ui.selCard = null; if (!r.ok) showToast(r.why); } break;
    case 'cancelTarget': ui.target = null; break;
    case 'confirmTarget': if (ui.target && ui.target.picks.length) { playTargeted({ dice: ui.target.picks.slice() }); return; } break;
    case 'face': if (ui.target) { playTargeted({ dice: [ui.target.picks[0]], face: +ds.f }); return; } break;
  }
  after();
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (ui.target) { ui.target = null; render(); }
  else if (ui.selCard != null) { ui.selCard = null; render(); }
  else if (ui.sheet) { ui.sheet = null; render(); }
});

ui.saved = readSave();
render();

/* offline + home screen support when hosted on its own site */
try {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1') && document.querySelector('link[rel="manifest"]')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline support unavailable */ });
  }
} catch (e) { /* offline support unavailable */ }
