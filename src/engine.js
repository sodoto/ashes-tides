'use strict';
/* ===== ENGINE: pure rules and AI, no DOM. ===== */
const START_HP = 50, MAX_HP = 60, START_CP = 2, MAX_CP = 15, HAND_LIMIT = 6, MAX_SHIELD = 10, MAX_BURN = 3, START_HAND = 4, DICE = 5;
const SAVE_VERSION = 2;

const HEROES = {
  ember: {
    id: 'ember', name: 'Ember Duelist', epithet: 'Burns bright, burns fast',
    style: 'Aggressive. Stacks Burn and hits back when attacked.',
    color: '#f0803f', ink: '#b4431c',
    faces: ['blade', 'blade', 'flame', 'flame', 'cinder', 'crest'],
    abilities: [
      { id: 'quickCut', name: 'Quick Cut', req: { blade: 3 }, lv: [{ dmg: 4 }, { dmg: 6 }] },
      { id: 'kindle', name: 'Kindle', req: { flame: 3 }, lv: [{ dmg: 3, burn: 1 }] },
      { id: 'emberTrail', name: 'Ember Trail', req: { blade: 1, flame: 1, cinder: 1 }, lv: [{ dmg: 3, burn: 1, draw: 1 }] },
      { id: 'scorchStep', name: 'Scorch Step', req: { blade: 2, flame: 2 }, lv: [{ dmg: 5, cp: 1 }, { dmg: 7, cp: 2 }] },
      { id: 'blazingFlurry', name: 'Blazing Flurry', straight: 4, lv: [{ dmg: 7, burn: 1 }] },
      { id: 'twinStrike', name: 'Twin Strike', req: { blade: 4 }, lv: [{ dmg: 8 }, { dmg: 10, undef: true }] },
      { id: 'infernalDance', name: 'Infernal Dance', straight: 5, lv: [{ dmg: 10, burn: 2, undef: true }] },
      { id: 'wildfire', name: 'Wildfire', req: { flame: 5 }, lv: [{ dmg: 11, burn: 3 }] },
      { id: 'phoenixRite', name: 'Phoenix Rite', req: { crest: 5 }, ult: true, lv: [{ dmg: 15, burn: 3, heal: 5 }] },
    ],
    defense: {
      id: 'riposte', name: 'Riposte', lv: [{ n: 4 }, { n: 5 }],
      text: 'Deal 2 damage back for each Blade. With 2 or more Flame, the attacker gets 1 Burn.',
      resolve(sym) { return { counter: 2 * (sym.blade || 0), burn: (sym.flame || 0) >= 2 ? 1 : 0 }; },
    },
    deck: { secondWind: 2, loadedDie: 1, jinx: 2, ironResolve: 1, parry: 2, scoutAhead: 1, quickBandage: 1, cheapShot: 1, fanFlames: 2, powderKeg: 1, whetstone: 2,
      up_quickCut: 1, up_scorchStep: 1, up_twinStrike: 1, up_riposte: 1 },
  },
  brine: {
    id: 'brine', name: 'Brine Oracle', epithet: 'Patient as the tide',
    style: 'Defensive. Shields, heals and slows you down.',
    color: '#5cc6ba', ink: '#17636e',
    faces: ['wave', 'wave', 'shell', 'shell', 'pearl', 'eye'],
    abilities: [
      { id: 'ripple', name: 'Ripple', req: { wave: 3 }, lv: [{ dmg: 4, shield: 1 }, { dmg: 6, shield: 2 }] },
      { id: 'tidalMend', name: 'Tidal Mend', req: { shell: 3 }, lv: [{ heal: 4, shield: 1 }] },
      { id: 'brinePair', name: 'Brine Pair', req: { wave: 2, shell: 2 }, lv: [{ dmg: 5, heal: 2 }, { dmg: 7, heal: 2 }] },
      { id: 'pearlTithe', name: 'Pearl Tithe', req: { pearl: 2 }, lv: [{ cp: 2, draw: 1 }] },
      { id: 'currentWeave', name: 'Current Weave', straight: 4, lv: [{ dmg: 6, chill: 1, shield: 1 }] },
      { id: 'riptide', name: 'Riptide', req: { wave: 4 }, lv: [{ dmg: 7, chill: 1 }, { dmg: 8, chill: 1, undef: true }] },
      { id: 'deepWard', name: 'Deep Ward', req: { shell: 4 }, lv: [{ heal: 4, shield: 4 }] },
      { id: 'grandTide', name: 'Grand Tide', straight: 5, lv: [{ dmg: 10, chill: 1, heal: 3, undef: true }] },
      { id: 'drown', name: 'Drown', req: { wave: 5 }, lv: [{ dmg: 12, chill: 1 }] },
      { id: 'seerGaze', name: "Seer's Gaze", req: { eye: 5 }, ult: true, lv: [{ dmg: 14, chill: 1, heal: 5 }] },
    ],
    defense: {
      id: 'undertow', name: 'Undertow', lv: [{ n: 4 }, { n: 5 }],
      text: 'Prevent 2 damage for each Shell. With 2 or more Pearl, heal 2.',
      resolve(sym) { return { prevent: 2 * (sym.shell || 0), heal: (sym.pearl || 0) >= 2 ? 2 : 0 }; },
    },
    deck: { secondWind: 1, tidalSurge: 2, loadedDie: 1, jinx: 2, ironResolve: 1, parry: 1, mirrorPool: 1, seaMist: 2, scoutAhead: 1, quickBandage: 1, cheapShot: 1, coldSnap: 1,
      up_ripple: 1, up_brinePair: 1, up_riptide: 1, up_undertow: 1 },
  },
};

/* Card types follow the rulebook: main = your main phases; roll = any roll phase (yours or your opponent's);
   instant = any time; upgrade = your main phases, stays in play. Only the player the game is waiting on can act. */
const CARDS = {
  secondWind: { name: 'Second Wind', type: 'roll', cost: 1, icon: 'dice', target: { who: 'self', kind: 'dice', max: 1 }, text: 'Reroll 1 of your dice.', ai: 6,
    apply(G, pi, a) { rerollLive(G, a.dice); } },
  tidalSurge: { name: 'Tidal Surge', type: 'roll', cost: 1, icon: 'dice', target: { who: 'self', kind: 'dice', max: 2 }, text: 'Reroll up to 2 of your dice.', ai: 6,
    apply(G, pi, a) { rerollLive(G, a.dice); } },
  loadedDie: { name: 'Loaded Die', type: 'roll', cost: 2, icon: 'dice', target: { who: 'self', kind: 'face' }, text: 'Change 1 of your dice to any face.', ai: 7,
    apply(G, pi, a) { liveSet(G).dice[a.dice[0]].face = a.face; } },
  jinx: { name: 'Jinx', type: 'roll', cost: 2, icon: 'eye', target: { who: 'opp', kind: 'dice', max: 1 }, text: 'Reroll 1 of your opponent’s dice while they roll, for attack or defense.', ai: 6,
    apply(G, pi, a) { rerollLive(G, a.dice); } },
  whetstone: { name: 'Whetstone', type: 'roll', cost: 1, icon: 'blade', text: 'Boost: your attack this turn deals +2 damage. Play it during your offensive roll.', ai: 4,
    cond(G, pi) { return G.phase === 'roll' && G.active === pi ? null : 'Play it during your own offensive roll, before you use an ability.'; },
    apply(G, pi) { G.players[pi].bonusDmg += 2; } },
  ironResolve: { name: 'Iron Resolve', type: 'instant', cost: 1, icon: 'shield', text: 'Gain 3 Shield.', ai: 5,
    apply(G, pi) { addShield(G, pi, 3); } },
  parry: { name: 'Parry', type: 'instant', cost: 1, icon: 'shield', text: 'When you are attacked: prevent 4 damage. Does not work on Ultimates.', ai: 7,
    cond: attackedCond, apply(G, pi) { G.pending.reduction += 4; G.pending.reducers.push('Parry'); } },
  mirrorPool: { name: 'Mirror Pool', type: 'instant', cost: 2, icon: 'wave', text: 'When you are attacked: prevent 2 damage and deal 2 back.', ai: 6,
    cond: attackedCond, apply(G, pi) { G.pending.reduction += 2; G.pending.reflect += 2; G.pending.reducers.push('Mirror Pool'); } },
  seaMist: { name: 'Sea Mist', type: 'instant', cost: 1, icon: 'wave', text: 'Gain 2 Shield and heal 1.', ai: 5,
    apply(G, pi) { addShield(G, pi, 2); heal(G, pi, 1); } },
  quickBandage: { name: 'Quick Bandage', type: 'main', cost: 2, icon: 'plus', text: 'Heal 4.', ai: 5,
    apply(G, pi) { heal(G, pi, 4); } },
  scoutAhead: { name: 'Scout Ahead', type: 'main', cost: 1, icon: 'cards', text: 'Draw 2 cards.', ai: 4,
    apply(G, pi) { draw(G, pi, 2); } },
  fanFlames: { name: 'Fan the Flames', type: 'main', cost: 1, icon: 'flame', text: 'Give the opponent 1 Burn.', ai: 5,
    apply(G, pi) { addBurn(G, 1 - pi, 1); } },
  powderKeg: { name: 'Powder Keg', type: 'main', cost: 3, icon: 'flame', text: 'Deal 4 damage and give 1 Burn.', ai: 6,
    apply(G, pi) { dealDamage(G, 1 - pi, 4); addBurn(G, 1 - pi, 1); } },
  cheapShot: { name: 'Cheap Shot', type: 'main', cost: 2, icon: 'blade', text: 'Deal 3 damage.', ai: 5,
    apply(G, pi) { dealDamage(G, 1 - pi, 3); } },
  coldSnap: { name: 'Cold Snap', type: 'main', cost: 2, icon: 'snow', text: 'Chill the opponent: 1 fewer roll on their next offensive roll.', ai: 5,
    apply(G, pi) { G.players[1 - pi].chill = 1; } },
};
function attackedCond(G, pi) {
  if (!(G.phase === 'defense' && G.pending && G.pending.defender === pi)) return 'Play it when you are attacked.';
  if (G.pending.ult) return 'Ultimates can’t be reduced.';
  return null;
}
/* upgrade cards, generated from hero data */
Object.keys(HEROES).forEach(hid => {
  const h = HEROES[hid];
  Object.keys(h.deck).filter(k => k.indexOf('up_') === 0).forEach(k => {
    const id = k.slice(3), isDef = h.defense.id === id;
    const ab = isDef ? h.defense : h.abilities.find(a => a.id === id);
    CARDS[k] = {
      name: ab.name + ' II', type: 'upgrade', cost: isDef || (ab.lv[1].dmg || 0) >= 9 ? 3 : 2, icon: 'up', hero: hid, ab: id, level: 2, ai: 9,
      text: isDef ? 'Upgrade ' + ab.name + ': roll ' + ab.lv[1].n + ' defense dice instead of ' + ab.lv[0].n + '.'
        : 'Upgrade ' + ab.name + ': ' + effText(ab.lv[1]) + ' (was ' + effText(ab.lv[0]) + ').',
      apply(G, pi) { G.players[pi].upg[id] = 2; },
    };
  });
});

/* ---------- utilities ---------- */
function makeRng(box) {
  return function () {
    const a = box.s = (box.s + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
  return arr;
}
function d6(G) { return Math.floor(G.rng() * 6); }
function log(G, text, who) { G.log.push({ t: text, who: who == null ? -1 : who, turn: G.turnNo }); if (G.log.length > 4000) G.log.shift(); return G.log[G.log.length - 1]; }
function banner(G, text) { G.banner = text; G.bannerSeq++; }
function fx(G, pi, type, n) { if (n > 0) G.fx.push({ pi, type, n }); }
function effText(eff, bonus) {
  const t = []; bonus = bonus || 0;
  if (eff.dmg) t.push((eff.dmg + bonus) + ' dmg');
  if (eff.undef) t.push('Undefendable');
  if (eff.burn) t.push(eff.burn + ' Burn');
  if (eff.chill) t.push('Chill');
  if (eff.heal) t.push('Heal ' + eff.heal);
  if (eff.shield) t.push(eff.shield + ' Shield');
  if (eff.cp) t.push('+' + eff.cp + ' CP');
  if (eff.draw) t.push('Draw ' + eff.draw);
  return t.join(' · ');
}
function level(p, id) { return p.upg[id] || 1; }
function abEff(p, ab) { return ab.lv[Math.min(level(p, ab.id), ab.lv.length) - 1]; }
function defN(p) { const d = p.hero.defense; return d.lv[Math.min(level(p, d.id), d.lv.length) - 1].n; }
function symCounts(hero, dice) {
  const c = {};
  dice.forEach(d => { const f = d.face != null ? d.face : d; if (f != null && f >= 0) { const s = hero.faces[f]; c[s] = (c[s] || 0) + 1; } });
  return c;
}
const STRAIGHTS = { 4: [[0, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5]], 5: [[0, 1, 2, 3, 4], [1, 2, 3, 4, 5]] };
function faceMet(hero, ab, faces) {
  if (ab.straight) { const s = new Set(faces.filter(f => f != null)); return STRAIGHTS[ab.straight].some(w => w.every(v => s.has(v))); }
  const c = symCounts(hero, faces);
  return Object.keys(ab.req).every(k => (c[k] || 0) >= ab.req[k]);
}
function reqText(ab) {
  if (ab.straight === 4) return 'a small straight (4 numbers in a row)';
  if (ab.straight === 5) return 'a large straight (5 numbers in a row)';
  return Object.keys(ab.req).map(s => ab.req[s] + ' ' + s[0].toUpperCase() + s.slice(1)).join(' + ');
}

/* ---------- state ---------- */
function newGame(opts) {
  const seed = opts.seed != null ? opts.seed : ((Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
  const rngBox = { s: seed | 0 }, rng = makeRng(rngBox);
  const humans = opts.humans || [true, false];
  const players = opts.heroes.map((hid, idx) => {
    const hero = HEROES[hid]; const deck = [];
    for (const cid of Object.keys(hero.deck)) for (let k = 0; k < hero.deck[cid]; k++) deck.push(cid);
    shuffle(deck, rng);
    return { idx, hero, human: !!humans[idx], hp: START_HP, cp: START_CP, hand: [], deck, discard: [], inPlay: [], upg: {}, shield: 0, burn: 0, chill: 0, bonusDmg: 0, deckSize: deck.length };
  });
  const G = {
    rng, rngBox, players, active: 0, start: 0, turnNo: 1, phase: 'main1',
    dice: Array.from({ length: DICE }, () => ({ face: null, held: false })),
    rolled: 0, rollsLeft: 0, pending: null, prompt: null, winner: null, log: [], fx: [], banner: null, bannerSeq: 0, rolloff: null,
  };
  players.forEach(p => draw(G, p.idx, START_HAND));
  // roll-off for the start player
  let a, b;
  do { a = d6(G) + 1; b = d6(G) + 1; } while (a === b);
  G.start = opts.start != null ? opts.start : (a > b ? 0 : 1);
  G.rolloff = [a, b];
  G.active = G.start;
  const sp = players[G.start].hero.name;
  log(G, 'Roll-off: ' + players[0].hero.name + ' ' + a + ', ' + players[1].hero.name + ' ' + b + '. ' + sp + ' goes first.');
  banner(G, 'Roll-off ' + a + ' vs ' + b + ': ' + (G.start === 0 && humans[0] ? 'you go first' : sp + ' goes first'));
  startTurn(G);
  return G;
}

function draw(G, pi, n) {
  const p = G.players[pi];
  for (let k = 0; k < n; k++) {
    if (!p.deck.length && p.discard.length) { p.deck = shuffle(p.discard, G.rng); p.discard = []; }
    if (p.deck.length) p.hand.push(p.deck.pop());
  }
}
function heal(G, pi, n) { const p = G.players[pi]; const before = p.hp; p.hp = Math.min(MAX_HP, p.hp + n); fx(G, pi, 'heal', p.hp - before); return p.hp - before; }
function addShield(G, pi, n) { const p = G.players[pi]; const before = p.shield; p.shield = Math.min(MAX_SHIELD, p.shield + n); fx(G, pi, 'shield', p.shield - before); }
function addBurn(G, pi, n) { const p = G.players[pi]; p.burn = Math.min(MAX_BURN, p.burn + n); }
function dealDamage(G, pi, n, opts) {
  const p = G.players[pi]; let rem = Math.max(0, n), absorbed = 0;
  if (rem > 0 && !(opts && opts.pierce) && p.shield > 0) { absorbed = Math.min(p.shield, rem); p.shield -= absorbed; rem -= absorbed; }
  if (rem > 0) { p.hp = Math.max(0, p.hp - rem); fx(G, pi, (opts && opts.burn) ? 'burn' : 'dmg', rem); }
  return { hp: rem, absorbed };
}
function checkWin(G) {
  const a = G.players[0], b = G.players[1];
  if (a.hp <= 0 || b.hp <= 0) {
    G.winner = (a.hp <= 0 && b.hp <= 0) ? -1 : (a.hp <= 0 ? 1 : 0);
    G.phase = 'over'; G.pending = null; G.prompt = null;
    log(G, G.winner === -1 ? 'Both heroes fall. A draw.' : G.players[G.winner].hero.name + ' wins the duel.');
    return true;
  }
  return false;
}

function startTurn(G) {
  const pi = G.active, p = G.players[pi];
  p.bonusDmg = 0; G.rolled = 0; G.rollsLeft = 0; G.pending = null; G.prompt = null;
  G.dice.forEach(d => { d.face = null; d.held = false; });
  Object.assign(log(G, p.hero.name + ' begins turn ' + Math.ceil(G.turnNo / 2) + '.', pi), { kind: 'turn', hp: G.players.map(x => x.hp) });
  // Upkeep
  if (p.burn > 0) {
    const n = p.burn; p.burn--;
    dealDamage(G, pi, n, { pierce: true, burn: true });
    log(G, 'Burn scorches ' + p.hero.name + ' for ' + n + '.', 1 - pi);
    if (checkWin(G)) return;
  }
  if (G.turnNo > 50) {
    const f = 1 + Math.floor((G.turnNo - 51) / 6);
    dealDamage(G, pi, f, { pierce: true });
    log(G, 'Fatigue drains ' + f + ' from ' + p.hero.name + '.');
    if (checkWin(G)) return;
  }
  // Income: the start player skips it on their first turn
  if (G.turnNo === 1) log(G, p.hero.name + ' goes first and skips income this turn.', pi);
  else { p.cp = Math.min(MAX_CP, p.cp + 1); draw(G, pi, 1); fx(G, pi, 'cp', 1); }
  G.phase = 'main1';
}
function nextTurn(G) { G.active = 1 - G.active; G.turnNo++; startTurn(G); }

/* who the game is waiting on */
function actor(G) {
  if (G.phase === 'over') return -1;
  if (G.prompt) return G.prompt.pi;
  if (G.phase === 'defense') return G.pending.defender;
  return G.active;
}
/* the dice currently being rolled, if any */
function liveSet(G) {
  if (G.phase === 'roll' && G.rolled > 0) return { owner: G.active, dice: G.dice, def: false };
  if (G.phase === 'defense' && G.pending && G.pending.def && G.pending.def.rolled) return { owner: G.pending.defender, dice: G.pending.def.dice, def: true };
  return null;
}
function rerollLive(G, idxs) { const ls = liveSet(G); idxs.forEach(i => { ls.dice[i].face = d6(G); }); }

/* ---------- offensive roll ---------- */
function toRollPhase(G) {
  if (G.phase !== 'main1' || G.prompt) return false;
  const p = G.players[G.active];
  G.rollsLeft = 3 - (p.chill ? 1 : 0);
  if (p.chill) { p.chill = 0; log(G, p.hero.name + ' is Chilled: only ' + G.rollsLeft + ' rolls this turn.', 1 - G.active); }
  G.phase = 'roll';
  return true;
}
function rollDice(G) {
  if (G.phase !== 'roll' || G.rollsLeft <= 0 || G.prompt) return null;
  const first = G.rolled === 0, rolled = [];
  G.dice.forEach((d, i) => { if (first || !d.held) { d.face = d6(G); rolled.push(i); } });
  if (first) G.dice.forEach(d => { d.held = false; });
  G.rollsLeft--; G.rolled++;
  return rolled;
}
function toggleHold(G, i) {
  if (G.phase !== 'roll' || G.prompt || G.rolled === 0 || G.rollsLeft <= 0 || G.dice[i].face == null) return false;
  G.dice[i].held = !G.dice[i].held; return true;
}
function availableAbilities(G, pi) {
  const p = G.players[pi], faces = G.dice.map(d => d.face);
  return p.hero.abilities.filter(ab => faceMet(p.hero, ab, faces));
}
function hasOppDiceCard(G, pi) {
  const p = G.players[pi];
  return p.hand.some(id => { const c = CARDS[id]; return c.target && c.target.who === 'opp' && p.cp >= c.cost; });
}
/* The attacker asks to use an ability. The opponent may first respond by changing a die. */
function requestActivate(G, abId) {
  if (G.phase !== 'roll' || G.prompt) return false;
  const pi = G.active, p = G.players[pi];
  if (abId === null) {
    Object.assign(log(G, p.hero.name + ' has no usable ability.', pi), { dice: G.dice.map(d => d.face), rolls: G.rolled });
    G.phase = 'main2'; return true;
  }
  if (G.rolled === 0) return false;
  const ab = p.hero.abilities.find(a => a.id === abId);
  if (!ab || !faceMet(p.hero, ab, G.dice.map(d => d.face))) return false;
  /* announcing an ability ends the rolling: if the opponent changes a die, the attacker can't reroll it back */
  if (hasOppDiceCard(G, 1 - pi)) { G.rollsLeft = 0; G.dice.forEach(d => { d.held = false; }); G.prompt = { pi: 1 - pi, kind: 'respond', abId, played: false }; return true; }
  activate(G, abId);
  return true;
}
function activate(G, abId) {
  const pi = G.active, p = G.players[pi], ab = p.hero.abilities.find(a => a.id === abId);
  const eff = Object.assign({}, abEff(p, ab));
  const bonus = eff.dmg ? p.bonusDmg : 0;
  if (eff.dmg) p.bonusDmg = 0;
  const lv = level(p, ab.id);
  const nm = ab.name + (lv > 1 ? ' II' : '');
  G.pending = { attacker: pi, defender: 1 - pi, abId, name: nm, ult: !!ab.ult, undef: !!eff.undef || !!ab.ult, eff, bonus, reduction: 0, reducers: [], reflect: 0, def: null };
  Object.assign(log(G, p.hero.name + ' uses ' + nm + (ab.ult ? ' (ULTIMATE)' : '') + ': ' + effText(eff, bonus) + '.', pi), { dice: G.dice.map(d => d.face), rolls: G.rolled });
  banner(G, (p.human ? 'You use ' : p.hero.name + ' uses ') + nm + (ab.ult ? ' — ULTIMATE' : '') + ' · ' + effText(eff, bonus));
  if (!eff.dmg || ab.ult) { resolveAttack(G); return; }
  G.phase = 'defense';
  const d = G.players[1 - pi];
  G.pending.def = { n: defN(d), dice: [], rolled: false, skip: !!eff.undef };
}

/* ---------- defensive roll ---------- */
function rollDefense(G) {
  const pend = G.pending;
  if (G.phase !== 'defense' || G.prompt || !pend.def || pend.def.rolled || pend.def.skip) return null;
  pend.def.dice = Array.from({ length: pend.def.n }, () => ({ face: d6(G), held: false }));
  pend.def.rolled = true;
  return pend.def.dice.map((d, i) => i);
}
function defenseOutcome(G) {
  const pend = G.pending;
  if (!pend || !pend.def || !pend.def.rolled) return {};
  const h = G.players[pend.defender].hero;
  return h.defense.resolve(symCounts(h, pend.def.dice));
}
function hitMath(G) {
  const pend = G.pending, op = G.players[pend.defender];
  const out = { base: pend.eff.dmg || 0, bonus: pend.bonus || 0, cards: 0, defense: 0, shield: 0, hp: 0, counter: 0, defHeal: 0, burnBack: 0 };
  let rem = out.base + out.bonus;
  if (!out.base) return out;
  if (pend.ult) { out.hp = rem; return out; }
  const d = defenseOutcome(G);
  out.cards = Math.min(pend.reduction, rem); rem -= out.cards;
  out.defense = Math.min(d.prevent || 0, rem); rem -= out.defense;
  out.shield = Math.min(op.shield, rem); rem -= out.shield;
  out.hp = rem; out.counter = d.counter || 0; out.defHeal = d.heal || 0; out.burnBack = d.burn || 0;
  return out;
}
/* The defender is done. The attacker may still respond by changing a defense die. */
function confirmDefense(G) {
  const pend = G.pending;
  if (G.phase !== 'defense' || G.prompt || !pend.def || !(pend.def.rolled || pend.def.skip)) return false;
  if (pend.def.rolled && !pend.def.logged) {
    pend.def.logged = true;
    const dh = G.players[pend.defender].hero;
    Object.assign(log(G, G.players[pend.defender].hero.name + ' defends with ' + dh.defense.name + '.', pend.defender), { dice: pend.def.dice.map(d => d.face), rolls: 1, def: true });
  }
  if (pend.def.rolled && hasOppDiceCard(G, pend.attacker)) { G.prompt = { pi: pend.attacker, kind: 'respondDef', played: false }; return true; }
  resolveAttack(G);
  return true;
}
/* During a 'respond' prompt: whether the attacker's dice still match the ability they announced. */
function announcedMet(G) {
  const pr = G.prompt, p = G.players[G.active];
  if (!pr || pr.kind !== 'respond') return false;
  return faceMet(p.hero, p.hero.abilities.find(a => a.id === pr.abId), G.dice.map(d => d.face));
}
/* During a response prompt: for each die of the live roll, in how many of its 6 faces a reroll helps the responder.
   Answering an attack, that means the announced ability no longer matches; answering a defense, that the hit lands harder. */
function rerollOdds(G) {
  const pr = G.prompt, ls = liveSet(G);
  if (!pr || !ls) return null;
  const owner = G.players[ls.owner], dice = ls.dice;
  let helps;
  if (pr.kind === 'respond') {
    if (!announcedMet(G)) return null;
    const ab = owner.hero.abilities.find(a => a.id === pr.abId);
    helps = () => !faceMet(owner.hero, ab, dice.map(d => d.face));
  } else {
    const val = () => { const m = hitMath(G); return m.hp - m.counter - m.defHeal - m.burnBack; };
    const base = val();
    helps = () => val() > base;
  }
  return dice.map(d => {
    const keep = d.face; let n = 0;
    for (let f = 0; f < 6; f++) { d.face = f; if (helps()) n++; }
    d.face = keep;
    return n;
  });
}
function passPrompt(G) {
  const pr = G.prompt;
  if (!pr) return false;
  if (pr.kind === 'respond' && pr.played && !announcedMet(G)) {
    const p = G.players[G.active];
    log(G, p.hero.abilities.find(a => a.id === pr.abId).name + ' no longer matches ' + p.hero.name + '’s dice.', 1 - G.active);
  }
  G.prompt = null;
  if (pr.kind === 'respond' && !pr.played) activate(G, pr.abId);
  else if (pr.kind === 'respondDef' && !pr.played) resolveAttack(G);
  /* if a card was played, control returns to the attacker (roll) or the defender (defense) */
  if (pr.kind === 'respondDef' && pr.played && G.pending && G.pending.def) G.pending.def.logged = false;
  return true;
}
function resolveAttack(G) {
  const pend = G.pending;
  if (!pend) return false;
  const a = pend.attacker, d = pend.defender, me = G.players[a], op = G.players[d], eff = pend.eff;
  if (eff.dmg) {
    const m = hitMath(G);
    op.shield -= m.shield;
    op.hp = Math.max(0, op.hp - m.hp); fx(G, d, 'dmg', m.hp);
    const parts = [String(m.base)];
    if (m.bonus) parts.push('+' + m.bonus + ' Boost');
    if (m.cards) parts.push('−' + m.cards + ' ' + pend.reducers.join(' & '));
    if (m.defense) parts.push('−' + m.defense + ' ' + op.hero.defense.name);
    if (m.shield) parts.push('−' + m.shield + ' Shield');
    const why = parts.length > 1 ? ' (' + parts.join(' ') + ')' : '';
    log(G, pend.name + ' hits ' + op.hero.name + ' for ' + m.hp + why + '.', a);
    banner(G, pend.name + ' hits for ' + m.hp + why);
    if (pend.reflect) { const r = dealDamage(G, a, pend.reflect); log(G, 'Mirror Pool reflects ' + r.hp + ' at ' + me.hero.name + '.', d); }
    if (m.counter) { const r = dealDamage(G, a, m.counter); log(G, op.hero.defense.name + ' strikes back at ' + me.hero.name + ' for ' + r.hp + (r.absorbed ? ' (' + r.absorbed + ' blocked by Shield)' : '') + '.', d); }
    if (m.defHeal) { const h = heal(G, d, m.defHeal); if (h) log(G, op.hero.name + ' heals ' + h + ' from ' + op.hero.defense.name + '.', d); }
    if (m.burnBack) { addBurn(G, a, 1); log(G, me.hero.name + ' catches 1 Burn from ' + op.hero.defense.name + '.', d); }
  }
  if (eff.burn) { const b = op.burn; addBurn(G, d, eff.burn); if (op.burn > b) log(G, op.hero.name + ' is burning (' + op.burn + ').', a); }
  if (eff.chill && !op.chill) { op.chill = 1; log(G, op.hero.name + ' is Chilled.', a); }
  if (eff.heal) { const h = heal(G, a, eff.heal); if (h) log(G, me.hero.name + ' heals ' + h + '.', a); }
  if (eff.shield) addShield(G, a, eff.shield);
  if (eff.cp) { me.cp = Math.min(MAX_CP, me.cp + eff.cp); fx(G, a, 'cp', eff.cp); }
  if (eff.draw) draw(G, a, eff.draw);
  G.pending = null; G.prompt = null;
  if (!checkWin(G)) G.phase = 'main2';
  return true;
}

/* ---------- cards ---------- */
const TYPE_WHEN = {
  main: 'Main cards are played in your own main phases.',
  upgrade: 'Upgrades are played in your own main phases.',
};
function canPlay(G, pi, idx) {
  const p = G.players[pi], id = p.hand[idx];
  if (!id) return { ok: false, why: 'No such card.' };
  const c = CARDS[id];
  if (G.phase === 'over') return { ok: false, why: 'The duel is over.' };
  if (actor(G) !== pi) return { ok: false, why: 'Wait until the game is waiting on you.' };
  if (c.type === 'main' || c.type === 'upgrade') {
    if (!(G.active === pi && (G.phase === 'main1' || G.phase === 'main2') && !G.prompt)) return { ok: false, why: TYPE_WHEN[c.type] };
    if (c.type === 'upgrade' && level(p, c.ab) >= c.level) return { ok: false, why: 'Already upgraded.' };
  } else if (c.type === 'roll') {
    const ls = liveSet(G);
    if (c.target) {
      if (!ls) return { ok: false, why: c.target.who === 'self' ? 'Play it after you roll, while your dice are on the table.' : 'Play it while your opponent is rolling.' };
      if (c.target.who === 'self' && ls.owner !== pi) return { ok: false, why: 'It changes your own dice. Play it when you roll.' };
      if (c.target.who === 'opp' && ls.owner === pi) return { ok: false, why: 'It changes your opponent’s dice. Play it while they roll.' };
    }
  }
  if (c.cond) { const w = c.cond(G, pi); if (w) return { ok: false, why: w }; }
  if (p.cp < c.cost) return { ok: false, why: 'Needs ' + c.cost + ' CP. You can sell cards for 1 CP each in your main phases.' };
  return { ok: true };
}
function playCard(G, pi, idx, arg) {
  const chk = canPlay(G, pi, idx);
  if (!chk.ok) return chk;
  const p = G.players[pi], id = p.hand[idx], c = CARDS[id];
  arg = arg || {};
  if (c.target) {
    const ls = liveSet(G), ds = arg.dice;
    if (!Array.isArray(ds) || !ds.length || new Set(ds).size !== ds.length) return { ok: false, why: 'Pick a die.' };
    if (ds.some(i => !(i >= 0 && i < ls.dice.length))) return { ok: false, why: 'Pick a die on the table.' };
    if (c.target.kind === 'dice' && ds.length > c.target.max) return { ok: false, why: 'Too many dice.' };
    if (c.target.kind === 'face' && !(arg.face >= 0 && arg.face < 6)) return { ok: false, why: 'Pick a face.' };
  }
  p.hand.splice(idx, 1); p.cp -= c.cost;
  if (c.type === 'upgrade') p.inPlay.push(id); else p.discard.push(id);
  if (G.prompt && G.prompt.pi === pi) G.prompt.played = true;
  c.apply(G, pi, arg);
  log(G, p.hero.name + ' plays ' + c.name + '.', pi);
  if (!p.human) banner(G, p.hero.name + ' plays ' + c.name);
  checkWin(G);
  return { ok: true };
}
function canSell(G, pi) {
  if (actor(G) !== pi || G.active !== pi || G.prompt) return { ok: false, why: 'You can sell cards in your own main phases.' };
  if (!(G.phase === 'main1' || G.phase === 'main2' || G.phase === 'discard')) return { ok: false, why: 'You can sell cards in your own main phases.' };
  return { ok: true };
}
function sellCard(G, pi, idx) {
  const chk = canSell(G, pi);
  if (!chk.ok) return chk;
  const p = G.players[pi], id = p.hand[idx];
  if (!id) return { ok: false, why: 'No such card.' };
  p.hand.splice(idx, 1); p.discard.push(id);
  const before = p.cp; p.cp = Math.min(MAX_CP, p.cp + 1); fx(G, pi, 'cp', p.cp - before);
  log(G, p.hero.name + ' sells ' + CARDS[id].name + ' for 1 CP.', pi);
  if (G.phase === 'discard' && p.hand.length <= HAND_LIMIT) nextTurn(G);
  return { ok: true };
}
function endTurn(G) {
  if (G.phase !== 'main2' || G.prompt) return false;
  if (G.players[G.active].hand.length > HAND_LIMIT) { G.phase = 'discard'; return true; }
  nextTurn(G); return true;
}

/* ---------- save / restore ---------- */
function serializeGame(G) {
  return JSON.stringify(G, function (k, v) {
    if (k === 'rng' || k === 'fx') return undefined;
    if (k === 'hero' && v && v.id) return v.id;
    return v;
  });
}
function restoreGame(str) {
  const G = JSON.parse(str);
  if (!G || !Array.isArray(G.players) || G.players.length !== 2 || !G.rngBox) throw new Error('bad save');
  G.players.forEach(p => { p.hero = HEROES[p.hero]; if (!p.hero || !p.upg) throw new Error('unknown hero'); });
  G.rng = makeRng(G.rngBox);
  G.fx = [];
  return G;
}

/* ---------- AI ---------- */
function scoreEff(G, pi, eff, bonus, ult) {
  const me = G.players[pi], op = G.players[1 - pi];
  const dmg = eff.dmg ? eff.dmg + (bonus || 0) : 0;
  let s = dmg * (ult || eff.undef ? 1.15 : 1);
  if (dmg > 0 && dmg >= op.hp + (ult ? 0 : op.shield)) s += 100;
  s += (eff.burn || 0) * (op.burn < MAX_BURN ? 2.2 : 0.4);
  s += Math.min(eff.heal || 0, START_HP - me.hp) * 0.9;
  s += Math.min(eff.shield || 0, MAX_SHIELD - me.shield) * 0.6;
  s += eff.chill ? (op.chill ? 0 : 3) : 0;
  s += (eff.cp || 0) * 1.1 + (eff.draw || 0) * 1.2;
  return s;
}
function abScore(G, pi, ab) { const p = G.players[pi]; return scoreEff(G, pi, abEff(p, ab), p.bonusDmg, ab.ult); }
function holdMask(hero, ab, faces) {
  const keep = faces.map(() => false);
  if (ab.straight) {
    let best = null;
    STRAIGHTS[ab.straight].forEach(w => { const n = w.filter(v => faces.indexOf(v) >= 0).length; if (!best || n > best.n) best = { w, n }; });
    best.w.forEach(v => { const i = faces.findIndex((f, k) => f === v && !keep[k]); if (i >= 0) keep[i] = true; });
    return keep;
  }
  Object.keys(ab.req).forEach(s => {
    let k = ab.req[s];
    faces.forEach((f, i) => { if (k > 0 && !keep[i] && f != null && hero.faces[f] === s) { keep[i] = true; k--; } });
  });
  return keep;
}
function reachProb(G, hero, ab, faces, R) {
  if (faceMet(hero, ab, faces)) return 1;
  if (R <= 0) return 0;
  let h = 2166136261;
  faces.forEach(f => { h = Math.imul(h ^ (f + 7), 16777619); });
  h = Math.imul(h ^ (G.turnNo * 31 + R), 16777619);
  for (let i = 0; i < ab.id.length; i++) h = Math.imul(h ^ ab.id.charCodeAt(i), 16777619);
  const rng = makeRng({ s: h | 0 }), N = 48;
  let hit = 0;
  for (let s = 0; s < N; s++) {
    const f = faces.slice();
    for (let r = 0; r < R; r++) {
      const keep = holdMask(hero, ab, f);
      for (let i = 0; i < f.length; i++) if (!keep[i]) f[i] = Math.floor(rng() * 6);
      if (faceMet(hero, ab, f)) { hit++; break; }
    }
  }
  return hit / N;
}
function bestMet(G, pi, faces) {
  const p = G.players[pi]; let b = null;
  p.hero.abilities.forEach(ab => { if (faceMet(p.hero, ab, faces)) { const sc = abScore(G, pi, ab); if (!b || sc > b.sc) b = { ab, sc }; } });
  return b;
}

function aiAct(G) {
  const pi = actor(G);
  if (pi < 0 || G.players[pi].human) return null;
  if (G.prompt) return aiPrompt(G, pi);
  switch (G.phase) {
    case 'main1': if (aiMain(G, pi)) return { kind: 'card' }; toRollPhase(G); return { kind: 'phase' };
    case 'roll': return aiRoll(G, pi);
    case 'defense': return aiDefense(G, pi);
    case 'main2': if (aiMain(G, pi)) return { kind: 'card' }; endTurn(G); return { kind: 'phase' };
    case 'discard': aiSellWorst(G, pi); return { kind: 'sell' };
  }
  return null;
}
function aiRoll(G, pi) {
  const p = G.players[pi], h = p.hero;
  if (G.rolled === 0) return { kind: 'roll', rolled: rollDice(G) };
  const faces = G.dice.map(d => d.face), R = G.rollsLeft;
  if (R > 0) {
    let best = null;
    h.abilities.forEach(ab => {
      const met = faceMet(h, ab, faces);
      const ev = abScore(G, pi, ab) * (met ? 1 : reachProb(G, h, ab, faces, R));
      if (!best || ev > best.ev + 1e-9 || (Math.abs(ev - best.ev) < 1e-9 && met && !best.met)) best = { ab, ev, met };
    });
    if (best && best.met) return aiFinish(G, pi);
    const keep = best && best.ev > 0 ? holdMask(h, best.ab, faces) : faces.map(() => false);
    G.dice.forEach((d, i) => { d.held = keep[i]; });
    return { kind: 'roll', rolled: rollDice(G) };
  }
  if (aiTryRollCard(G, pi)) return { kind: 'card' };
  return aiFinish(G, pi);
}
function aiFinish(G, pi) {
  const p = G.players[pi], best = bestMet(G, pi, G.dice.map(d => d.face));
  if (!best) { requestActivate(G, null); return { kind: 'skip' }; }
  if (abEff(p, best.ab).dmg > 0) {
    const wi = p.hand.indexOf('whetstone');
    if (wi >= 0 && p.cp >= 2 && canPlay(G, pi, wi).ok) { playCard(G, pi, wi, {}); return { kind: 'card' }; }
  }
  requestActivate(G, best.ab.id);
  return { kind: 'ability', ab: best.ab };
}
function aiTryRollCard(G, pi) {
  const p = G.players[pi], faces = G.dice.map(d => d.face);
  const sc = f => { const b = bestMet(G, pi, f); return b ? b.sc : 0; };
  const base = sc(faces), thresh = { secondWind: 2.5, tidalSurge: 3, loadedDie: 4 };
  let bp = null;
  const consider = (idx, arg, gain, id) => { if (gain >= thresh[id] && (!bp || gain > bp.gain)) bp = { idx, arg, gain }; };
  const withF = ch => { const f = faces.slice(); ch.forEach(x => { f[x[0]] = x[1]; }); return f; };
  p.hand.forEach((id, idx) => {
    if (!thresh[id] || !canPlay(G, pi, idx).ok) return;
    if (id === 'loadedDie') {
      for (let i = 0; i < DICE; i++) for (let f = 0; f < 6; f++) consider(idx, { dice: [i], face: f }, sc(withF([[i, f]])) - base, id);
    } else if (id === 'secondWind') {
      for (let i = 0; i < DICE; i++) { let s = 0; for (let f = 0; f < 6; f++) s += sc(withF([[i, f]])); consider(idx, { dice: [i] }, s / 6 - base, id); }
    } else {
      for (let i = 0; i < DICE; i++) for (let j = i + 1; j < DICE; j++) {
        let s = 0; for (let f = 0; f < 6; f++) for (let g = 0; g < 6; g++) s += sc(withF([[i, f], [j, g]]));
        consider(idx, { dice: [i, j] }, s / 36 - base, id);
      }
    }
  });
  return bp ? playCard(G, pi, bp.idx, bp.arg).ok : false;
}
function aiMain(G, pi) {
  const p = G.players[pi], op = G.players[1 - pi], oppHp = op.hp + op.shield;
  const reserve = G.phase === 'main1' ? 2 : 1;
  for (let idx = 0; idx < p.hand.length; idx++) {
    const id = p.hand[idx], c = CARDS[id];
    if (!canPlay(G, pi, idx).ok) continue;
    const spare = p.cp - c.cost; let ok = false;
    switch (id) {
      case 'quickBandage': ok = spare >= reserve && START_HP - p.hp >= 5; break;
      case 'scoutAhead': ok = spare >= reserve && p.hand.length <= 5; break;
      case 'fanFlames': ok = spare >= reserve && op.burn <= 1; break;
      case 'powderKeg': ok = spare >= reserve || 4 >= oppHp; break;
      case 'cheapShot': ok = spare >= reserve || 3 >= oppHp; break;
      case 'coldSnap': ok = spare >= reserve && !op.chill; break;
      case 'seaMist': ok = spare >= reserve + 1 && START_HP - p.hp >= 4 && p.shield <= 2; break;
      case 'ironResolve': ok = G.phase === 'main2' && spare >= reserve + 1 && p.shield === 0 && p.hp <= 35; break;
      default: ok = c.type === 'upgrade' && spare >= 0;
    }
    if (ok && playCard(G, pi, idx, {}).ok) return true;
  }
  // sell surplus cards for CP: in main 2 keep at most 5; sell to afford an upgrade in main 1
  if (G.phase === 'main2' && p.hand.length > 5 && p.cp < MAX_CP) { aiSellWorst(G, pi); return true; }
  if (G.phase === 'main1') {
    const up = p.hand.find(id => CARDS[id].type === 'upgrade' && level(p, CARDS[id].ab) < 2);
    if (up && CARDS[up].cost - p.cp === 1 && p.hand.length >= 3 && aiSellWorst(G, pi, true)) return true;
  }
  return false;
}
function aiSellWorst(G, pi, keepUpgrades) {
  const p = G.players[pi]; let bi = -1, bv = 1e9;
  p.hand.forEach((id, i) => {
    const c = CARDS[id];
    if (keepUpgrades && c.type === 'upgrade') return;
    let v = c.ai + G.rng() * 0.5;
    if (c.type === 'upgrade' && level(p, c.ab) >= c.level) v = 0;
    if (v < bv) { bv = v; bi = i; }
  });
  if (bi < 0) { if (keepUpgrades) return false; bi = 0; }
  return sellCard(G, pi, bi).ok;
}
function aiDefense(G, pi) {
  const p = G.players[pi], pend = G.pending, def = pend.def;
  if (!def.rolled && !def.skip) return { kind: 'defroll', rolled: rollDefense(G) };
  const m = hitMath(G);
  if (m.hp > 0 && !pend.ult) {
    const lethal = m.hp >= p.hp;
    const order = [['parry', 3], ['mirrorPool', 4], ['ironResolve', 5], ['seaMist', 5]];
    for (const [id, min] of order) {
      const idx = p.hand.indexOf(id);
      if (idx < 0 || !(lethal || m.hp >= min) || !canPlay(G, pi, idx).ok) continue;
      if (p.cp - CARDS[id].cost < 0) continue;
      playCard(G, pi, idx, {});
      return { kind: 'card' };
    }
  }
  confirmDefense(G);
  return { kind: 'defconfirm' };
}
/* responses: change one die of the opponent's roll */
function aiPrompt(G, pi) {
  const pr = G.prompt, p = G.players[pi], opp = G.players[1 - pi];
  if (pr.played) { passPrompt(G); return { kind: 'pass' }; }
  const ji = p.hand.findIndex(id => CARDS[id].target && CARDS[id].target.who === 'opp' && p.cp >= CARDS[id].cost);
  if (ji < 0) { passPrompt(G); return { kind: 'pass' }; }
  const ls = liveSet(G);
  if (pr.kind === 'respond') {
    const ab = opp.hero.abilities.find(a => a.id === pr.abId), eff = abEff(opp, ab);
    const worth = ab.ult || (eff.dmg || 0) + opp.bonusDmg >= 8;
    if (worth) {
      const faces = ls.dice.map(d => d.face), mask = holdMask(opp.hero, ab, faces);
      const target = mask.findIndex(k => k);
      if (target >= 0) { playCard(G, pi, ji, { dice: [target] }); return { kind: 'card' }; }
    }
  } else if (pr.kind === 'respondDef') {
    const d = defenseOutcome(G), val = (d.prevent || 0) + (d.counter || 0);
    if (val >= 4) {
      const good = opp.hero.id === 'brine' ? 'shell' : 'blade';
      const target = ls.dice.findIndex(x => opp.hero.faces[x.face] === good);
      if (target >= 0) { playCard(G, pi, ji, { dice: [target] }); return { kind: 'card' }; }
    }
  }
  passPrompt(G);
  return { kind: 'pass' };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HEROES, CARDS, START_HP, MAX_HP, MAX_CP, HAND_LIMIT, SAVE_VERSION, newGame, toRollPhase, rollDice, toggleHold, requestActivate, passPrompt,
    rollDefense, confirmDefense, hitMath, rerollOdds, announcedMet, defenseOutcome, playCard, canPlay, sellCard, canSell, endTurn, availableAbilities, aiAct, actor, liveSet,
    effText, scoreEff, abEff, level, serializeGame, restoreGame, faceMet, reqText };
}
