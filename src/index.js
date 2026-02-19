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
  ArrowRight: { pressed: false },
  ArrowLeft: { pressed: false }
};

function decreaseTimer() {
  if (timer > 0) {
    timerId = setTimeout(decreaseTimer, 1000);
    timer--;
    document.querySelector('#timer').innerHTML = timer;
  }

  if (timer === 0) {
    determineWinner({ player, enemy, timerId });
    gameOver = true;
  }
}

function initGame(mode) {
    gameMode = mode;
    gameOver = false;
    timer = 60;
    document.querySelector('#timer').innerHTML = timer;
    document.querySelector('#player-health').style.width = '100%';
    document.querySelector('#enemy-health').style.width = '100%';
    document.querySelector('#display-text').style.display = 'none';
    document.querySelector('#main-menu').style.display = 'none';

    player.position = { x: 200, y: 0 };
    player.health = 100;
    player.dead = false;
    player.velocity = { x: 0, y: 0 };

    enemy.position = { x: 800, y: 100 };
    enemy.health = 100;
    enemy.dead = false;
    enemy.velocity = { x: 0, y: 0 };

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
  player.update(c);
  enemy.update(c);

  if (gameMode === 'MENU') {
      // Maybe slow rotation or idle animation?
      // Reset positions to keep them on screen if they drift?
      // For now, just let gravity work.
      if (player.position.y + player.height < canvas.height - 96) player.velocity.y += GRAVITY;
      else player.velocity.y = 0;

      if (enemy.position.y + enemy.height < canvas.height - 96) enemy.velocity.y += GRAVITY;
      else enemy.velocity.y = 0;

      return;
  }

  if (gameOver) return;

  player.velocity.x = 0;
  enemy.velocity.x = 0;

  // Player 1 Movement
  if (keys.a.pressed && player.lastKey === 'a') player.velocity.x = -5;
  else if (keys.d.pressed && player.lastKey === 'd') player.velocity.x = 5;
  if (keys.a.pressed && !keys.d.pressed) player.velocity.x = -5;
  if (keys.d.pressed && !keys.a.pressed) player.velocity.x = 5;

  // Player 2 Movement / AI
  if (gameMode === 'pvp') {
    if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') enemy.velocity.x = -5;
    else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') enemy.velocity.x = 5;
    if (keys.ArrowLeft.pressed && !keys.ArrowRight.pressed) enemy.velocity.x = -5;
    if (keys.ArrowRight.pressed && !keys.ArrowLeft.pressed) enemy.velocity.x = 5;
  } else if (gameMode === 'pvcpu') {
    const dx = player.position.x - enemy.position.x;
    const distance = Math.abs(dx);
    const attackRange = enemy.attackBox.width;

    if (distance > attackRange - 20) {
        if (player.position.x < enemy.position.x) enemy.velocity.x = -3;
        else enemy.velocity.x = 3;
    } else {
        if (Math.random() < 0.05) enemy.attack();
        if (Math.random() < 0.02) {
             if (player.position.x < enemy.position.x) enemy.velocity.x = 3;
             else enemy.velocity.x = -3;
        }
    }
    if (Math.random() < 0.005 && enemy.velocity.y === 0) enemy.velocity.y = -20;
  }

  // Detect Collisions
  if (rectangularCollision({ rectangle1: player, rectangle2: enemy }) && player.isAttacking) {
    player.isAttacking = false;
    enemy.health -= 20;
    document.querySelector('#enemy-health').style.width = enemy.health + '%';
  }

  if (rectangularCollision({ rectangle1: enemy, rectangle2: player }) && enemy.isAttacking) {
    enemy.isAttacking = false;
    player.health -= 20;
    document.querySelector('#player-health').style.width = player.health + '%';
  }

  if (enemy.health <= 0 || player.health <= 0) {
    determineWinner({ player, enemy, timerId });
    gameOver = true;
  }
}

animate();

window.addEventListener('keydown', (event) => {
  if (gameMode === 'MENU') return;

  if (gameOver) {
      if (event.key === ' ') {
          initGame(gameMode); // Restart same mode
      }
      return;
  }

  switch (event.key) {
    case 'd':
      keys.d.pressed = true;
      player.lastKey = 'd';
      break;
    case 'a':
      keys.a.pressed = true;
      player.lastKey = 'a';
      break;
    case 'w':
      if (player.velocity.y === 0) player.velocity.y = -20;
      break;
    case ' ':
      player.attack();
      break;

    case 'ArrowRight':
      keys.ArrowRight.pressed = true;
      enemy.lastKey = 'ArrowRight';
      break;
    case 'ArrowLeft':
      keys.ArrowLeft.pressed = true;
      enemy.lastKey = 'ArrowLeft';
      break;
    case 'ArrowUp':
      if (gameMode === 'pvp' && enemy.velocity.y === 0) enemy.velocity.y = -20;
      break;
    case 'ArrowDown':
      if (gameMode === 'pvp') enemy.attack();
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'd': keys.d.pressed = false; break;
    case 'a': keys.a.pressed = false; break;
    case 'ArrowRight': keys.ArrowRight.pressed = false; break;
    case 'ArrowLeft': keys.ArrowLeft.pressed = false; break;
  }
});
