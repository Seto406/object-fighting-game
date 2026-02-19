import { Toaster, Microwave } from './classes.js';
import { rectangularCollision, determineWinner } from './utils.js';
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
      determineWinner({ player, enemy, timerId });
      gameOver = true;
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

function backToMenu() {
  gamePaused = false;
  gameMode = 'MENU';
  clearTimeout(timerId);
  document.querySelector('#pause-menu').style.display = 'none';
  document.querySelector('#main-menu').style.display = 'flex';
  document.querySelector('#display-text').style.display = 'none';
  document.querySelector('#pause-btn').style.display = 'none';
}

function initGame(mode) {
    gameMode = mode;
    gamePaused = false;
    gameOver = false;
    timer = 60;
    document.querySelector('#timer').innerHTML = timer;
    document.querySelector('#player-health').style.width = '100%';
    document.querySelector('#enemy-health').style.width = '100%';
    document.querySelector('#display-text').style.display = 'none';
    document.querySelector('#main-menu').style.display = 'none';
    document.querySelector('#pause-menu').style.display = 'none';
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


function animate() {
  window.requestAnimationFrame(animate);

  // Background
  c.fillStyle = '#FFE4B5';
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.fillStyle = '#8B4513';
  c.fillRect(0, canvas.height - 96, canvas.width, 96);

  c.strokeStyle = '#DEB887';
  c.lineWidth = 2;
  for(let i=0; i<canvas.width; i+=50) {
      c.beginPath(); c.moveTo(i, 0); c.lineTo(i, canvas.height - 96); c.stroke();
  }
  for(let j=0; j<canvas.height - 96; j+=50) {
      c.beginPath(); c.moveTo(0, j); c.lineTo(canvas.width, j); c.stroke();
  }

  // Always draw characters (even in menu)
  if (gamePaused) {
    player.draw(c);
    enemy.draw(c);
    return;
  }

  player.update(c);
  enemy.update(c);

  if (gameMode === 'MENU') {
      if (player.position.y + player.height < canvas.height - 96) player.velocity.y += GRAVITY;
      else player.velocity.y = 0;

      if (enemy.position.y + enemy.height < canvas.height - 96) enemy.velocity.y += GRAVITY;
      else enemy.velocity.y = 0;

      return;
  }

  if (gameOver) return;

  player.velocity.x = 0;
  enemy.velocity.x = 0;

  // Player 1 Block
  player.isBlocking = keys.s.pressed;

  // Player 1 Movement
  if (!player.isBlocking) {
      if (keys.a.pressed && player.lastKey === 'a') player.velocity.x = -5;
      else if (keys.d.pressed && player.lastKey === 'd') player.velocity.x = 5;
      if (keys.a.pressed && !keys.d.pressed) player.velocity.x = -5;
      if (keys.d.pressed && !keys.a.pressed) player.velocity.x = 5;
  }

  // Player 2 Movement / AI
  if (gameMode === 'pvp') {
    enemy.isBlocking = keys.ArrowDown.pressed;

    if (!enemy.isBlocking) {
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
    if (player.isAttacking && distance < attackRange + 50) {
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

    if (projectileIncoming && Math.random() < 0.1) {
        enemy.isBlocking = true;
    }

    if (!enemy.isBlocking) {
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
    if (enemy.isBlocking) damage = 2; // Chip damage
    enemy.health -= damage;
    if (enemy.health < 0) enemy.health = 0;
    document.querySelector('#enemy-health').style.width = enemy.health + '%';
  }

  // Detect Collisions - Player 2 Melee
  if (rectangularCollision({ rectangle1: enemy, rectangle2: player }) && enemy.isAttacking) {
    enemy.isAttacking = false;
    let damage = 20;
    if (player.isBlocking) damage = 2;
    player.health -= damage;
    if (player.health < 0) player.health = 0;
    document.querySelector('#player-health').style.width = player.health + '%';
  }

  // Projectile Collisions - Player 1 vs Enemy
  for (let i = player.projectiles.length - 1; i >= 0; i--) {
    const projectile = player.projectiles[i];
    if (rectangularCollision({ rectangle1: projectile, rectangle2: enemy })) {
      player.projectiles.splice(i, 1);
      let damage = 10;
      if (enemy.isBlocking) damage = 1;
      enemy.health -= damage;
      if (enemy.health < 0) enemy.health = 0;
      document.querySelector('#enemy-health').style.width = enemy.health + '%';
    }
  }

  // Projectile Collisions - Enemy vs Player
  for (let i = enemy.projectiles.length - 1; i >= 0; i--) {
    const projectile = enemy.projectiles[i];
    if (rectangularCollision({ rectangle1: projectile, rectangle2: player })) {
      enemy.projectiles.splice(i, 1);
      let damage = 10;
      if (player.isBlocking) damage = 1;
      player.health -= damage;
      if (player.health < 0) player.health = 0;
      document.querySelector('#player-health').style.width = player.health + '%';
    }
  }

  if (enemy.health <= 0 || player.health <= 0) {
    determineWinner({ player, enemy, timerId });
    gameOver = true;
  }
}

animate();

window.addEventListener('keydown', (event) => {
  if (gameMode === 'MENU') return;

  if (event.key === 'Escape') {
    togglePause();
  }

  if (gamePaused) return;

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
      if (player.velocity.y === 0 && !player.isBlocking) player.velocity.y = -20;
      break;
    case 's':
      keys.s.pressed = true;
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
      if (gameMode === 'pvp' && enemy.velocity.y === 0 && !enemy.isBlocking) enemy.velocity.y = -20;
      break;
    case 'ArrowDown':
       // Used for blocking now
       keys.ArrowDown.pressed = true;
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
