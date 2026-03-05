import { CursorKnight, GlitchWyrm, Particle } from './classes.js';
import { rectangularCollision, determineWinner, drawBackground } from './utils.js';
import { GRAVITY } from './constants.js';

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
canvas.width = 1024;
canvas.height = 576;

let gameMode = 'MENU';
let gamePaused = false;
let gameOver = false;
let timer = 75;
let timerId;
let p1Wins = 0;
let p2Wins = 0;
let roundsToWin = 2;
let roundDuration = 75;
let isRoundTransition = false;
let hitstop = 0;

const particles = [];
let screenshake = { x: 0, y: 0, intensity: 0 };

const player = new CursorKnight({
  position: { x: 180, y: 0 },
  velocity: { x: 0, y: 0 },
  attackBox: { offset: { x: 54, y: 5 }, width: 95, height: 46 }
});

const enemy = new GlitchWyrm({
  position: { x: 770, y: 0 },
  velocity: { x: 0, y: 0 },
  attackBox: { offset: { x: -120, y: 5 }, width: 120, height: 46 }
});

const keys = { a: { pressed: false }, d: { pressed: false }, s: { pressed: false }, ArrowRight: { pressed: false }, ArrowLeft: { pressed: false }, ArrowDown: { pressed: false } };

function updateFocusUI() {
  document.querySelector('#player-focus').style.width = `${player.focus}%`;
  document.querySelector('#enemy-focus').style.width = `${enemy.focus}%`;
}

function decreaseTimer() {
  timerId = setTimeout(() => {
    if (timer > 0) {
      timer--;
      document.querySelector('#timer').innerHTML = timer;
      decreaseTimer();
    }
    if (timer === 0) handleRoundEnd(determineWinner({ player, enemy, timerId }));
  }, 1000);
}

function togglePause() {
  if (gameMode === 'MENU' || gameOver) return;
  gamePaused = !gamePaused;
  if (gamePaused) {
    clearTimeout(timerId);
    document.querySelector('#pause-menu').style.display = 'flex';
    document.querySelector('#pause-btn').style.display = 'none';
  } else {
    decreaseTimer();
    document.querySelector('#pause-menu').style.display = 'none';
    document.querySelector('#pause-btn').style.display = 'block';
  }
}

function handleGameOver(result) {
  document.querySelector('#game-over-result').innerHTML = result;
  document.querySelector('#game-over-menu').style.display = 'flex';
  document.querySelector('#pause-btn').style.display = 'none';
}

function handleRoundEnd(result) {
  if (isRoundTransition || gameOver) return;

  if (result === 'Player 1 Wins') p1Wins++;
  else if (result === 'Player 2 Wins') p2Wins++;

  document.querySelector('#p1-score').innerHTML = `Wins: ${p1Wins}`;
  document.querySelector('#p2-score').innerHTML = `Wins: ${p2Wins}`;

  if (p1Wins >= roundsToWin || p2Wins >= roundsToWin) {
    gameOver = true;
    handleGameOver(p1Wins > p2Wins ? 'Cursor Knight Wins Match' : 'Glitch Wyrm Wins Match');
    return;
  }

  isRoundTransition = true;
  clearTimeout(timerId);
  document.querySelector('#display-text').style.display = 'flex';
  document.querySelector('#display-text').innerHTML = result;
  setTimeout(() => { isRoundTransition = false; startRound(); }, 1800);
}

function backToMenu() {
  gamePaused = false;
  gameMode = 'MENU';
  clearTimeout(timerId);
  document.querySelector('#pause-menu').style.display = 'none';
  document.querySelector('#game-over-menu').style.display = 'none';
  document.querySelector('#main-menu').style.display = 'flex';
  document.querySelector('#display-text').style.display = 'none';
  document.querySelector('#pause-btn').style.display = 'none';
}

function startRound() {
  gamePaused = false;
  gameOver = false;
  hitstop = 0;
  timer = roundDuration;
  document.querySelector('#timer').innerHTML = timer;
  document.querySelector('#display-text').style.display = 'none';
  document.querySelector('#pause-btn').style.display = 'block';

  document.querySelector('#player-health').style.width = '100%';
  document.querySelector('#player-health-damage').style.width = '100%';
  document.querySelector('#enemy-health').style.width = '100%';
  document.querySelector('#enemy-health-damage').style.width = '100%';

  Object.assign(player, { position: { x: 180, y: 0 }, velocity: { x: 0, y: 0 }, health: 100, focus: 0, isBlocking: false, isStunned: false, projectiles: [] });
  Object.assign(enemy, { position: { x: 770, y: 0 }, velocity: { x: 0, y: 0 }, health: 100, focus: 0, isBlocking: false, isStunned: false, projectiles: [] });

  keys.a.pressed = keys.d.pressed = keys.s.pressed = false;
  keys.ArrowRight.pressed = keys.ArrowLeft.pressed = keys.ArrowDown.pressed = false;

  updateFocusUI();
  clearTimeout(timerId);
  decreaseTimer();
}

function initGame(mode) {
  gameMode = mode;
  roundDuration = parseInt(document.querySelector('#round-time').value);
  roundsToWin = parseInt(document.querySelector('#rounds-to-win').value);
  p1Wins = 0; p2Wins = 0;
  document.querySelector('#p1-score').innerHTML = 'Wins: 0';
  document.querySelector('#p2-score').innerHTML = 'Wins: 0';
  document.querySelector('#main-menu').style.display = 'none';
  document.querySelector('#pause-menu').style.display = 'none';
  document.querySelector('#game-over-menu').style.display = 'none';
  startRound();
}

document.querySelector('#btn-pvp').addEventListener('click', () => initGame('pvp'));
document.querySelector('#btn-cpu').addEventListener('click', () => initGame('pvcpu'));
document.querySelector('#pause-btn').addEventListener('click', togglePause);
document.querySelector('#btn-resume').addEventListener('click', togglePause);
document.querySelector('#btn-menu').addEventListener('click', backToMenu);
document.querySelector('#btn-rematch').addEventListener('click', () => initGame(gameMode));
document.querySelector('#btn-home').addEventListener('click', backToMenu);

function spawnHitParticles(target, color) {
  for (let i = 0; i < 7; i++) {
    particles.push(new Particle({
      position: { x: target.position.x + target.width / 2, y: target.position.y + target.height / 2 },
      velocity: { x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6 },
      radius: Math.random() * 3 + 1,
      color
    }));
  }
}

function applyDamage(attacker, defender, damage, isBlock) {
  const realDamage = isBlock ? Math.max(1, Math.floor(damage * 0.2)) : damage;
  defender.health = Math.max(0, defender.health - realDamage);
  attacker.gainFocus(isBlock ? 5 : 11);
  defender.gainFocus(4);
  if (!isBlock) {
    defender.isStunned = true;
    defender.stunTimer = 12;
    hitstop = 8;
    screenshake.intensity = 10;
  } else {
    hitstop = 4;
    screenshake.intensity = 4;
  }
}

function animate() {
  window.requestAnimationFrame(animate);

  if (screenshake.intensity > 0) {
    screenshake.x = (Math.random() - 0.5) * screenshake.intensity;
    screenshake.y = (Math.random() - 0.5) * screenshake.intensity;
    screenshake.intensity *= 0.88;
    if (screenshake.intensity < 0.5) screenshake.intensity = 0;
  } else {
    screenshake.x = 0; screenshake.y = 0;
  }

  c.fillStyle = 'black';
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.save();
  c.translate(screenshake.x, screenshake.y);
  drawBackground(c, canvas);

  if (gamePaused) { player.draw(c); enemy.draw(c); c.restore(); return; }

  if (hitstop > 0) {
    hitstop--;
    player.draw(c); enemy.draw(c);
    for (const p of particles) p.draw(c);
    c.restore();
    return;
  }

  player.update(c);
  enemy.update(c);

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update(c);
    if (particles[i].opacity <= 0) particles.splice(i, 1);
  }

  c.restore();

  if (gameMode === 'MENU') {
    if (player.position.y + player.height < canvas.height - 96) player.velocity.y += GRAVITY; else player.velocity.y = 0;
    if (enemy.position.y + enemy.height < canvas.height - 96) enemy.velocity.y += GRAVITY; else enemy.velocity.y = 0;
    return;
  }

  if (gameOver || isRoundTransition) return;

  player.velocity.x = 0;
  enemy.velocity.x = 0;

  player.isBlocking = keys.s.pressed && !player.isStunned;
  if (!player.isBlocking && !player.isStunned) {
    if (keys.a.pressed) player.velocity.x = -5;
    if (keys.d.pressed) player.velocity.x = 5;
  }

  if (gameMode === 'pvp') {
    enemy.isBlocking = keys.ArrowDown.pressed && !enemy.isStunned;
    if (!enemy.isBlocking && !enemy.isStunned) {
      if (keys.ArrowLeft.pressed) enemy.velocity.x = -5;
      if (keys.ArrowRight.pressed) enemy.velocity.x = 5;
    }
  } else {
    const dx = player.position.x - enemy.position.x;
    const dist = Math.abs(dx);
    enemy.isBlocking = player.isAttacking && dist < 170 && Math.random() < 0.45;
    enemy.lastKey = dx < 0 ? 'ArrowLeft' : 'ArrowRight';
    if (!enemy.isBlocking && !enemy.isStunned) {
      if (dist > 190) enemy.velocity.x = dx < 0 ? -3.8 : 3.8;
      else if (Math.random() < 0.07) enemy.attack();
      if (Math.random() < 0.015) enemy.shoot();
      if (enemy.focus >= 100 && Math.random() < 0.02) enemy.burst();
    }
  }

  if (rectangularCollision({ rectangle1: player, rectangle2: enemy }) && player.isAttacking) {
    player.isAttacking = false;
    const blocked = enemy.isBlocking && ((enemy.facing === 'left' && player.position.x < enemy.position.x) || (enemy.facing === 'right' && player.position.x > enemy.position.x));
    applyDamage(player, enemy, 18, blocked);
    spawnHitParticles(enemy, '#89f8ff');
    document.querySelector('#enemy-health').style.width = `${enemy.health}%`;
    document.querySelector('#enemy-health-damage').style.width = `${enemy.health}%`;
  }

  if (rectangularCollision({ rectangle1: enemy, rectangle2: player }) && enemy.isAttacking) {
    enemy.isAttacking = false;
    const blocked = player.isBlocking && ((player.facing === 'left' && enemy.position.x < player.position.x) || (player.facing === 'right' && enemy.position.x > player.position.x));
    applyDamage(enemy, player, 18, blocked);
    spawnHitParticles(player, '#ff72e0');
    document.querySelector('#player-health').style.width = `${player.health}%`;
    document.querySelector('#player-health-damage').style.width = `${player.health}%`;
  }

  for (let i = player.projectiles.length - 1; i >= 0; i--) {
    const proj = player.projectiles[i];
    if (rectangularCollision({ rectangle1: proj, rectangle2: enemy })) {
      player.projectiles.splice(i, 1);
      const blocked = enemy.isBlocking && ((proj.velocity.x > 0 && enemy.facing === 'left') || (proj.velocity.x < 0 && enemy.facing === 'right'));
      applyDamage(player, enemy, proj.type === 'burst' ? 22 : 10, blocked);
      spawnHitParticles(enemy, '#9adfff');
      document.querySelector('#enemy-health').style.width = `${enemy.health}%`;
      document.querySelector('#enemy-health-damage').style.width = `${enemy.health}%`;
    }
  }

  for (let i = enemy.projectiles.length - 1; i >= 0; i--) {
    const proj = enemy.projectiles[i];
    if (rectangularCollision({ rectangle1: proj, rectangle2: player })) {
      enemy.projectiles.splice(i, 1);
      const blocked = player.isBlocking && ((proj.velocity.x > 0 && player.facing === 'left') || (proj.velocity.x < 0 && player.facing === 'right'));
      applyDamage(enemy, player, proj.type === 'burst' ? 22 : 10, blocked);
      spawnHitParticles(player, '#ff84e8');
      document.querySelector('#player-health').style.width = `${player.health}%`;
      document.querySelector('#player-health-damage').style.width = `${player.health}%`;
    }
  }

  updateFocusUI();

  if (player.health <= 0 || enemy.health <= 0) handleRoundEnd(determineWinner({ player, enemy, timerId }));
}

animate();

window.addEventListener('keydown', (event) => {
  if (gameMode === 'MENU') return;
  if (event.key === 'Escape') togglePause();
  if (gamePaused || isRoundTransition) return;
  if (gameOver && event.key === ' ') return initGame(gameMode);

  switch (event.key) {
    case 'a': keys.a.pressed = true; player.lastKey = 'a'; break;
    case 'd': keys.d.pressed = true; player.lastKey = 'd'; break;
    case 'w': if (!player.isBlocking) player.jump(); break;
    case 's': keys.s.pressed = true; break;
    case ' ': if (!player.isBlocking) player.attack(); break;
    case 'f': if (!player.isBlocking) player.shoot(); break;
    case 'q': if (player.burst()) screenshake.intensity = 12; break;

    case 'ArrowLeft': keys.ArrowLeft.pressed = true; enemy.lastKey = 'ArrowLeft'; break;
    case 'ArrowRight': keys.ArrowRight.pressed = true; enemy.lastKey = 'ArrowRight'; break;
    case 'ArrowUp': if (gameMode === 'pvp' && !enemy.isBlocking) enemy.jump(); break;
    case 'ArrowDown': keys.ArrowDown.pressed = true; break;
    case 'Enter': if (gameMode === 'pvp' && !enemy.isBlocking) enemy.attack(); break;
    case 'Shift': if (gameMode === 'pvp' && !enemy.isBlocking) enemy.shoot(); break;
    case 'm': if (gameMode === 'pvp' && enemy.burst()) screenshake.intensity = 12; break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'a': keys.a.pressed = false; break;
    case 'd': keys.d.pressed = false; break;
    case 's': keys.s.pressed = false; break;
    case 'ArrowLeft': keys.ArrowLeft.pressed = false; break;
    case 'ArrowRight': keys.ArrowRight.pressed = false; break;
    case 'ArrowDown': keys.ArrowDown.pressed = false; break;
  }
});
