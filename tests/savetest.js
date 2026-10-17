const E = require("../src/engine.js");
let ok = 0;
for (let i = 0; i < 400; i++) {
  const heroes = i % 2 ? ['ember', 'brine'] : ['brine', 'ember'];
  const A = E.newGame({ heroes, humans: [false, false], seed: 7000 + i });
  const cut = 5 + (i * 37) % 150;
  for (let s = 0; s < cut && A.phase !== 'over'; s++) E.aiAct(A);
  const json = E.serializeGame(A);
  JSON.parse(json); // must be valid JSON
  const B = E.restoreGame(json);
  while (A.phase !== 'over') { E.aiAct(A); E.aiAct(B); }
  while (B.phase !== 'over') E.aiAct(B);
  const fa = E.serializeGame(A), fb = E.serializeGame(B);
  if (fa !== fb) { console.log('MISMATCH at game', i, 'cut', cut); process.exit(1); }
  ok++;
}
console.log('save/restore determinism ok for', ok, 'games');
