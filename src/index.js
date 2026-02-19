import { Toaster, Microwave, Particle } from './classes.js';
import { rectangularCollision, determineWinner, drawBackground } from './utils.js';
import { GRAVITY } from './constants.js';

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576;

c.fillRect(0, 0, canvas.width, canvas.height);

// Game State
let gameMode = 'MENU'; // 'MENU', 'pvp', 'pvcpu'
let gamePaused = false;
let gameOver = false;
let timer = 60;
let timerId;
let p1Wins = 0;
let p2Wins = 0;
let roundsToWin = 2;
let roundDuration = 60;
let isRoundTransition = false;

const particles = [];
let screenshake = { x: 0, y: 0, intensity: 0 };

// Player 1 (Toaster)
const player = new Toaster({
  position: { x: 200, y: 0 },
  velocity: { x: 0, y: 0 },
  offset: { x: 0, y: 0 },
  attackBox: { offset: { x: 60, y: 0 }, width: 100, height: 50 }
});

// Player 2 (Microwave)
const enemy = new Microwave({
  position: { x: 800, y: 100 },
  velocity: { x: 0, y: 0 },
  offset: { x: -50, y: 0 },
  attackBox: { offset: { x: -170, y: 0 }, width: 170, height: 50 }
});

const keys = {
  a: { pressed: false },
  d: { pressed: false },
  s: { pressed: false },
  ArrowRight: { pressed: false },
  ArrowLeft: { pressed: false },
  ArrowDown: { pressed: false }
};

function decreaseTimer() {
  timerId = setTimeout(() => {
    if (timer > 0) {
      timer--;
      document.querySelector('#timer').innerHTML = timer;
      decreaseTimer();
    }

    if (timer === 0) {
      const result = determineWinner({ player, enemy, timerId });
      handleRoundEnd(result);
    }
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

    if (result === 'Player 1 Wins') {
        p1Wins++;
    } else if (result === 'Player 2 Wins') {
        p2Wins++;
    }

    document.querySelector('#p1-score').innerHTML = 'Wins: ' + p1Wins;
    document.querySelector('#p2-score').innerHTML = 'Wins: ' + p2Wins;

    if (p1Wins >= roundsToWin || p2Wins >= roundsToWin) {
        gameOver = true;
        let matchResult = result;
        if (p1Wins > p2Wins) matchResult = 'Player 1 Wins Match';
        else if (p2Wins > p1Wins) matchResult = 'Player 2 Wins Match';

        handleGameOver(matchResult);
    } else {
        isRoundTransition = true;
        clearTimeout(timerId);
        document.querySelector('#display-text').style.display = 'flex';
        document.querySelector('#display-text').innerHTML = result;

        setTimeout(() => {
            isRoundTransition = false;
            startRound();
        }, 2000);
    }
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
    timer = roundDuration;
    document.querySelector('#timer').innerHTML = timer;
    document.querySelector('#player-health').style.width = '100%';
    document.querySelector('#player-health-damage').style.width = '100%';
    document.querySelector('#enemy-health').style.width = '100%';
    document.querySelector('#enemy-health-damage').style.width = '100%';
    document.querySelector('#display-text').style.display = 'none';
    document.querySelector('#pause-btn').style.display = 'block';

    player.position = { x: 200, y: 0 };
    player.health = 100;
    player.dead = false;
    player.velocity = { x: 0, y: 0 };
    player.projectiles = [];
    player.isBlocking = false;

    enemy.position = { x: 800, y: 100 };
    enemy.health = 100;
    enemy.dead = false;
    enemy.velocity = { x: 0, y: 0 };
    enemy.projectiles = [];
    enemy.isBlocking = false;

    // Reset keys
    keys.a.pressed = false;
    keys.d.pressed = false;
    keys.s.pressed = false;
    keys.ArrowRight.pressed = false;
    keys.ArrowLeft.pressed = false;
    keys.ArrowDown.pressed = false;

    clearTimeout(timerId);
    decreaseTimer();
}

function initGame(mode) {
    gameMode = mode;

    // Read settings
    const timeSelect = document.querySelector('#round-time');
    roundDuration = parseInt(timeSelect.value);
    const roundSelect = document.querySelector('#rounds-to-win');
    roundsToWin = parseInt(roundSelect.value);

    p1Wins = 0;
    p2Wins = 0;
    document.querySelector('#p1-score').innerHTML = 'Wins: ' + p1Wins;
    document.querySelector('#p2-score').innerHTML = 'Wins: ' + p2Wins;

    document.querySelector('#main-menu').style.display = 'none';
    document.querySelector('#pause-menu').style.display = 'none';
    document.querySelector('#game-over-menu').style.display = 'none';

    startRound();
}

// Menu Listeners
document.querySelector('#btn-pvp').addEventListener('click', () => {
    initGame('pvp');
});

document.querySelector('#btn-cpu').addEventListener('click', () => {
    initGame('pvcpu');
});

document.querySelector('#pause-btn').addEventListener('click', togglePause);
document.querySelector('#btn-resume').addEventListener('click', togglePause);
document.querySelector('#btn-menu').addEventListener('click', backToMenu);
document.querySelector('#btn-rematch').addEventListener('click', () => {
    initGame(gameMode);
});
document.querySelector('#btn-home').addEventListener('click', backToMenu);


function animate() {
  window.requestAnimationFrame(animate);

  // Screenshake update
  if (screenshake.intensity > 0) {
      screenshake.x = (Math.random() - 0.5) * screenshake.intensity;
      screenshake.y = (Math.random() - 0.5) * screenshake.intensity;
      screenshake.intensity *= 0.9;
      if (screenshake.intensity < 0.5) screenshake.intensity = 0;
  } else {
      screenshake.x = 0;
      screenshake.y = 0;
  }

  // Clear canvas before shake to avoid trails
  c.fillStyle = 'black';
  c.fillRect(0, 0, canvas.width, canvas.height);

  c.save();
  c.translate(screenshake.x, screenshake.y);

  // Background
  drawBackground(c, canvas);

  // Always draw characters (even in menu)
  if (gamePaused) {
    player.draw(c);
    enemy.draw(c);
    c.restore();
    return;
  }

  player.update(c);
  enemy.update(c);

  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    if (particle.opacity <= 0) {
        particles.splice(i, 1);
    } else {
        particle.update(c);
    }
  }

  // End of drawing relative to screenshake
  c.restore();

  if (gameMode === 'MENU') {
      if (player.position.y + player.height < canvas.height - 96) player.velocity.y += GRAVITY;
      else player.velocity.y = 0;

      if (enemy.position.y + enemy.height < canvas.height - 96) enemy.velocity.y += GRAVITY;
      else enemy.velocity.y = 0;

      return;
  }

  if (gameOver) return;
  if (isRoundTransition) return;

  player.velocity.x = 0;
  enemy.velocity.x = 0;

  // Player 1 Block
  player.isBlocking = keys.s.pressed && !player.isStunned;

  // Player 1 Movement
  if (!player.isBlocking && !player.isStunned) {
      if (keys.a.pressed && player.lastKey === 'a') player.velocity.x = -5;
      else if (keys.d.pressed && player.lastKey === 'd') player.velocity.x = 5;
      if (keys.a.pressed && !keys.d.pressed) player.velocity.x = -5;
      if (keys.d.pressed && !keys.a.pressed) player.velocity.x = 5;
  }

  // Player 2 Movement / AI
  if (gameMode === 'pvp') {
    enemy.isBlocking = keys.ArrowDown.pressed && !enemy.isStunned;

    if (!enemy.isBlocking && !enemy.isStunned) {
        if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') enemy.velocity.x = -5;
        else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') enemy.velocity.x = 5;
        if (keys.ArrowLeft.pressed && !keys.ArrowRight.pressed) enemy.velocity.x = -5;
        if (keys.ArrowRight.pressed && !keys.ArrowLeft.pressed) enemy.velocity.x = 5;
    }
  } else if (gameMode === 'pvcpu') {
    // AI Logic
    const dx = player.position.x - enemy.position.x;
    const distance = Math.abs(dx);
    const attackRange = enemy.attackBox.width;

    enemy.isBlocking = false;

    // Determine Facing
    if (player.position.x < enemy.position.x) {
        if (enemy.velocity.x < 0) enemy.lastKey = 'ArrowLeft';
    } else {
        if (enemy.velocity.x > 0) enemy.lastKey = 'ArrowRight';
    }

    // Defensive Block
    if (player.isAttacking && distance < attackRange + 50 && !enemy.isStunned) {
        if (Math.random() < 0.1) enemy.isBlocking = true;
    }
    // Block Projectiles
    let projectileIncoming = false;
    player.projectiles.forEach(proj => {
        const dist = Math.abs(proj.position.x - enemy.position.x);
        if (dist < 250 && dist > 0) {
             // Check if projectile is moving towards enemy
             if ((proj.velocity.x > 0 && proj.position.x < enemy.position.x) ||
                 (proj.velocity.x < 0 && proj.position.x > enemy.position.x)) {
                 projectileIncoming = true;
             }
        }
    });

    if (projectileIncoming && Math.random() < 0.1 && !enemy.isStunned) {
        enemy.isBlocking = true;
    }

    if (!enemy.isBlocking && !enemy.isStunned) {
         // Movement and Attack
        if (distance > attackRange - 20) {
             if (distance > 300 && Math.random() < 0.01) {
                 enemy.shoot();
             } else {
                if (player.position.x < enemy.position.x) enemy.velocity.x = -3;
                else enemy.velocity.x = 3;
             }
        } else {
            if (Math.random() < 0.05) enemy.attack();
            if (Math.random() < 0.02) {
                 if (player.position.x < enemy.position.x) enemy.velocity.x = 3;
                 else enemy.velocity.x = -3;
            }
        }
        if (Math.random() < 0.005 && enemy.velocity.y === 0) enemy.velocity.y = -20;
    }
  }

  // Detect Collisions - Player 1 Melee
  if (rectangularCollision({ rectangle1: player, rectangle2: enemy }) && player.isAttacking) {
    player.isAttacking = false;
    let damage = 20;

    // Directional Blocking Check
    const isBlockingCorrectly = enemy.isBlocking && (
        (enemy.facing === 'left' && player.position.x < enemy.position.x) ||
        (enemy.facing === 'right' && player.position.x > enemy.position.x)
    );

    if (isBlockingCorrectly) damage = 2; // Chip damage
    enemy.health -= damage;

    // Pushback
    if (player.position.x < enemy.position.x) {
        enemy.position.x += 60;
    } else {
        enemy.position.x -= 60;
    }

    // Stun
    enemy.isStunned = true;
    enemy.stunTimer = 15;

    // Particles
    for (let i = 0; i < 8; i++) {
        particles.push(new Particle({
            position: {
                x: enemy.position.x + enemy.width / 2,
                y: enemy.position.y + enemy.height / 2
            },
            velocity: {
                x: (Math.random() - 0.5) * 6,
                y: (Math.random() - 0.5) * 6
            },
            radius: Math.random() * 3,
            color: enemy.color,
            type: 'spark'
        }));
    }
    screenshake.intensity = 15;

    if (enemy.health < 0) enemy.health = 0;
    document.querySelector('#enemy-health').style.width = enemy.health + '%';
    document.querySelector('#enemy-health-damage').style.width = enemy.health + '%';
  }

  // Detect Collisions - Player 2 Melee
  if (rectangularCollision({ rectangle1: enemy, rectangle2: player }) && enemy.isAttacking) {
    enemy.isAttacking = false;
    let damage = 20;

    const isBlockingCorrectly = player.isBlocking && (
        (player.facing === 'left' && enemy.position.x < player.position.x) ||
        (player.facing === 'right' && enemy.position.x > player.position.x)
    );

    if (isBlockingCorrectly) damage = 2;
    player.health -= damage;

    // Pushback
    if (enemy.position.x < player.position.x) {
        player.position.x += 60;
    } else {
        player.position.x -= 60;
    }

    // Stun
    player.isStunned = true;
    player.stunTimer = 15;

    // Particles
    for (let i = 0; i < 8; i++) {
        particles.push(new Particle({
            position: {
                x: player.position.x + player.width / 2,
                y: player.position.y + player.height / 2
            },
            velocity: {
                x: (Math.random() - 0.5) * 6,
                y: (Math.random() - 0.5) * 6
            },
            radius: Math.random() * 3,
            color: player.color,
            type: 'crumb'
        }));
    }
    screenshake.intensity = 15;

    if (player.health < 0) player.health = 0;
    document.querySelector('#player-health').style.width = player.health + '%';
    document.querySelector('#player-health-damage').style.width = player.health + '%';
  }

  // Projectile Collisions - Player 1 vs Enemy
  for (let i = player.projectiles.length - 1; i >= 0; i--) {
    const projectile = player.projectiles[i];
    if (rectangularCollision({ rectangle1: projectile, rectangle2: enemy })) {
      player.projectiles.splice(i, 1);
      let damage = 10;

      const isBlockingCorrectly = enemy.isBlocking && (
          (projectile.velocity.x > 0 && enemy.facing === 'left') ||
          (projectile.velocity.x < 0 && enemy.facing === 'right')
      );

      if (isBlockingCorrectly) damage = 1;
      enemy.health -= damage;
      if (enemy.health < 0) enemy.health = 0;
      document.querySelector('#enemy-health').style.width = enemy.health + '%';
      document.querySelector('#enemy-health-damage').style.width = enemy.health + '%';
    }
  }

  // Projectile Collisions - Enemy vs Player
  for (let i = enemy.projectiles.length - 1; i >= 0; i--) {
    const projectile = enemy.projectiles[i];
    if (rectangularCollision({ rectangle1: projectile, rectangle2: player })) {
      enemy.projectiles.splice(i, 1);
      let damage = 10;

      const isBlockingCorrectly = player.isBlocking && (
          (projectile.velocity.x > 0 && player.facing === 'left') ||
          (projectile.velocity.x < 0 && player.facing === 'right')
      );

      if (isBlockingCorrectly) damage = 1;
      player.health -= damage;
      if (player.health < 0) player.health = 0;
      document.querySelector('#player-health').style.width = player.health + '%';
      document.querySelector('#player-health-damage').style.width = player.health + '%';
    }
  }

  if (enemy.health <= 0 || player.health <= 0) {
    const result = determineWinner({ player, enemy, timerId });
    handleRoundEnd(result);
  }
}

animate();

window.addEventListener('keydown', (event) => {
  if (gameMode === 'MENU') return;

  if (event.key === 'Escape') {
    togglePause();
  }

  if (gamePaused || isRoundTransition) return;

  if (gameOver) {
      if (event.key === ' ') {
          initGame(gameMode);
      }
      return;
  }

  switch (event.key) {
    // Player 1
    case 'd':
      keys.d.pressed = true;
      player.lastKey = 'd';
      break;
    case 'a':
      keys.a.pressed = true;
      player.lastKey = 'a';
      break;
    case 'w':
      if (!player.isBlocking) player.jump();
      break;
    case 's':
      keys.s.pressed = true;
      break;
    case 'e':
      if (!player.isBlocking) player.dash();
      break;
    case ' ':
      if (!player.isBlocking) player.attack();
      break;
    case 'f':
      if (!player.isBlocking) player.shoot();
      break;

    // Player 2
    case 'ArrowRight':
      keys.ArrowRight.pressed = true;
      enemy.lastKey = 'ArrowRight';
      break;
    case 'ArrowLeft':
      keys.ArrowLeft.pressed = true;
      enemy.lastKey = 'ArrowLeft';
      break;
    case 'ArrowUp':
      if (gameMode === 'pvp' && !enemy.isBlocking) enemy.jump();
      break;
    case 'ArrowDown':
       // Used for blocking now
       keys.ArrowDown.pressed = true;
       break;
    case '.':
       if (gameMode === 'pvp' && !enemy.isBlocking) enemy.dash();
       break;
    case 'Enter':
      if (gameMode === 'pvp' && !enemy.isBlocking) enemy.attack();
      break;
    case 'Shift':
      if (gameMode === 'pvp' && !enemy.isBlocking) enemy.shoot();
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'd': keys.d.pressed = false; break;
    case 'a': keys.a.pressed = false; break;
    case 's': keys.s.pressed = false; break;

    case 'ArrowRight': keys.ArrowRight.pressed = false; break;
    case 'ArrowLeft': keys.ArrowLeft.pressed = false; break;
    case 'ArrowDown': keys.ArrowDown.pressed = false; break;
  }
});
