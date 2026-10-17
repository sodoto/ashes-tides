const E = require("../src/engine.js");
function aiGame(h0, h1, seed, start) {
  const G = E.newGame({ heroes: [h0, h1], humans: [false, false], seed, start });
  let steps = 0;
  while (G.phase !== 'over') {
    if (++steps > 20000) throw new Error('no end, seed ' + seed);
    if (!E.aiAct(G)) throw new Error('AI stuck in ' + G.phase + ' seed ' + seed + ' prompt ' + JSON.stringify(G.prompt));
  }
  return G;
}
const N = +(process.argv[2] || 600);
const stats = { ember: 0, brine: 0, draws: 0, n: 0, turns: 0, firstWins: 0, ults: 0, upg: 0, sells: 0, defs: 0, jinx: 0 };
for (let i = 0; i < N; i++) {
  for (const [a, b] of [['ember', 'brine'], ['brine', 'ember']]) {
    const G = aiGame(a, b, 1000 + i * 2 + (a === 'brine' ? 1 : 0));
    stats.n++; stats.turns += G.turnNo;
    if (G.winner === -1) stats.draws++; else { stats[G.players[G.winner].hero.id]++; if (G.winner === G.start) stats.firstWins++; }
    G.log.forEach(l => { if (/ULTIMATE/.test(l.t)) stats.ults++; if (/plays .* II\./.test(l.t)) stats.upg++; if (/ sells /.test(l.t)) stats.sells++; if (l.def) stats.defs++; if (/plays Jinx/.test(l.t)) stats.jinx++; });
  }
}
const pc = x => (100 * x / stats.n).toFixed(1) + '%';
console.log(`games ${stats.n}: ember ${pc(stats.ember)} brine ${pc(stats.brine)} draws ${stats.draws} | first player wins ${pc(stats.firstWins)} | avg rounds ${(stats.turns / stats.n / 2).toFixed(1)}`);
console.log(`per game: ultimates ${(stats.ults / stats.n).toFixed(2)}, upgrades ${(stats.upg / stats.n).toFixed(2)}, sells ${(stats.sells / stats.n).toFixed(1)}, defense rolls ${(stats.defs / stats.n).toFixed(1)}, jinx ${(stats.jinx / stats.n).toFixed(2)}`);

// Monkey: player 0 acts at random through the public API, player 1 is AI.
function monkeyGame(h0, h1, seed) {
  const G = E.newGame({ heroes: [h0, h1], humans: [true, false], seed });
  const rnd = n => Math.floor(Math.random() * n);
  let steps = 0;
  while (G.phase !== 'over') {
    if (++steps > 30000) throw new Error('monkey no end ' + seed);
    const who = E.actor(G);
    if (who === 1) { if (!E.aiAct(G)) throw new Error('ai null in ' + G.phase); }
    else {
      const me = G.players[0];
      if (me.hand.length && Math.random() < 0.4) {
        const i = rnd(me.hand.length), c = E.CARDS[me.hand[i]];
        const ls = E.liveSet(G);
        const arg = c.target && ls ? { dice: [rnd(ls.dice.length)], face: rnd(6) } : {};
        if (Math.random() < 0.15) E.sellCard(G, 0, i); else E.playCard(G, 0, i, arg);
        if (G.phase === 'over') break;
        continue;
      }
      if (G.prompt) { E.passPrompt(G); continue; }
      switch (G.phase) {
        case 'main1': E.toRollPhase(G); break;
        case 'roll': {
          if (G.rolled === 0) { E.rollDice(G); break; }
          G.dice.forEach((d, i) => { if (Math.random() < 0.4) E.toggleHold(G, i); });
          const av = E.availableAbilities(G, 0);
          if (G.rollsLeft > 0 && Math.random() < 0.6) { E.rollDice(G); break; }
          if (av.length) E.requestActivate(G, av[rnd(av.length)].id); else if (G.rollsLeft > 0) E.rollDice(G); else E.requestActivate(G, null);
          break;
        }
        case 'defense': if (!G.pending.def.rolled && !G.pending.def.skip) E.rollDefense(G); else E.confirmDefense(G); break;
        case 'main2': E.endTurn(G); break;
        case 'discard': E.sellCard(G, 0, rnd(me.hand.length)); break;
      }
    }
    for (const p of G.players) {
      if (p.hp < 0 || p.hp > E.MAX_HP || p.cp < 0 || p.cp > E.MAX_CP || p.shield < 0 || p.shield > 10 || p.burn < 0 || p.burn > 3) throw new Error('invariant ' + JSON.stringify([p.hp, p.cp, p.shield, p.burn]));
      if (p.hand.length + p.deck.length + p.discard.length + p.inPlay.length !== p.deckSize) throw new Error('card count');
    }
  }
  return G;
}
let mw = 0; const M = 400;
for (let i = 0; i < M; i++) { const G = monkeyGame(i % 2 ? 'ember' : 'brine', i % 2 ? 'brine' : 'ember', 5000 + i); if (G.winner === 0) mw++; }
console.log(`monkey games ok: ${M}, monkey won ${(100 * mw / M).toFixed(1)}%`);
