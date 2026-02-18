import { Toaster, Microwave } from './classes.js';
import { rectangularCollision, determineWinner } from './utils.js';
import { InputHandler } from './input.js';
import { Particle } from './particles.js';
import { audio } from './audio.js';

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576;

c.fillRect(0, 0, canvas.width, canvas.height);

const gravity = 0.7;

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
  facing: 'left',
  attackBox: { offset: { x: -170, y: 0 }, width: 170, height: 50 }
});

const input = new InputHandler();
const particles = [];
let shake = 0;

function decreaseTimer() {
  if (timer > 0) {
    timerId = setTimeout(decreaseTimer, 1000);
    timer--;
    document.querySelector('#timer').innerHTML = timer;
  }

  if (timer === 0) {
    determineWinner({ player, enemy, timerId });
    gameOver = true;
    audio.play('gameOver');
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
    audio.init();
    initGame('pvp');
});

document.querySelector('#btn-cpu').addEventListener('click', () => {
    audio.init();
    initGame('pvcpu');
});


function animate() {
  window.requestAnimationFrame(animate);

  // Shake Effect
  c.save();
  if (shake > 0) {
      const shakeIntensity = 5;
      const dx = (Math.random() - 0.5) * shakeIntensity;
      const dy = (Math.random() - 0.5) * shakeIntensity;
      c.translate(dx, dy);
      shake--;
  }

  // Background
  c.fillStyle = '#FFE4B5';
  c.fillRect(-10, -10, canvas.width + 20, canvas.height + 20); // Oversize for shake
  c.fillStyle = '#8B4513';
  c.fillRect(-10, canvas.height - 96, canvas.width + 20, 96);

  c.strokeStyle = '#DEB887';
  c.lineWidth = 2;
  for(let i=0; i<canvas.width; i+=50) {
      c.beginPath(); c.moveTo(i, 0); c.lineTo(i, canvas.height - 96); c.stroke();
  }
  for(let j=0; j<canvas.height - 96; j+=50) {
      c.beginPath(); c.moveTo(0, j); c.lineTo(canvas.width, j); c.stroke();
  }

  // Particles (behind characters)
  particles.forEach((particle, index) => {
    if (particle.opacity <= 0) {
        particles.splice(index, 1);
    } else {
        particle.update(c);
    }
  });

  // Always draw characters (even in menu)
  player.update(c);
  enemy.update(c);

  c.restore(); // Restore context after shake/draw

  if (gameMode === 'MENU') {
      // Maybe slow rotation or idle animation?
      // Reset positions to keep them on screen if they drift?
      // For now, just let gravity work.
      if (player.position.y + player.height < canvas.height - 96) player.velocity.y += gravity;
      else player.velocity.y = 0;

      if (enemy.position.y + enemy.height < canvas.height - 96) enemy.velocity.y += gravity;
      else enemy.velocity.y = 0;

      return;
  }

  if (gameOver) return;

  player.velocity.x = 0;
  enemy.velocity.x = 0;

  // Player 1 Movement
  if (input.keys.a.pressed && player.lastKey === 'a') player.velocity.x = -5;
  else if (input.keys.d.pressed && player.lastKey === 'd') player.velocity.x = 5;
  if (input.keys.a.pressed && !input.keys.d.pressed) player.velocity.x = -5;
  if (input.keys.d.pressed && !input.keys.a.pressed) player.velocity.x = 5;

  // Player 2 Movement / AI
  if (gameMode === 'pvp') {
    if (input.keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') enemy.velocity.x = -5;
    else if (input.keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') enemy.velocity.x = 5;
    if (input.keys.ArrowLeft.pressed && !input.keys.ArrowRight.pressed) enemy.velocity.x = -5;
    if (input.keys.ArrowRight.pressed && !input.keys.ArrowLeft.pressed) enemy.velocity.x = 5;
  } else if (gameMode === 'pvcpu') {
    const dx = player.position.x - enemy.position.x;
    const distance = Math.abs(dx);
    const direction = dx > 0 ? 1 : -1; // 1 means player is to the right relative to enemy

    // AI Logic
    if (distance > 400) {
        // Far range: Move closer, occasional beam
        enemy.velocity.x = direction * 3;
        if (Math.random() < 0.02) enemy.attack('special');
    }
    else if (distance > 200) {
        // Mid range: Move closer, jump, or beam
        enemy.velocity.x = direction * 3;
        if (Math.random() < 0.005) enemy.attack('special');
        if (Math.random() < 0.01) enemy.velocity.y = -20; // Jump
    }
    else {
        // Close range combat
        // Chance to attack
        if (Math.random() < 0.1) {
             const rand = Math.random();
             if (rand < 0.4) enemy.attack('light');
             else if (rand < 0.7) enemy.attack('heavy');
             else if (rand < 0.8) enemy.attack('special');
        }

        // Movement in close range (spacing)
        if (Math.random() < 0.1) {
             // 50/50 retreat or advance
             enemy.velocity.x = (Math.random() < 0.5 ? -direction : direction) * 3;
        }

        // Jump occasionally
    if (Math.random() < 0.005 && enemy.velocity.y === 0) {
        enemy.velocity.y = -20;
        audio.play('jump');
    }
    }
  }

  // Update Facing based on Velocity
  if (player.velocity.x > 0) player.facing = 'right';
  else if (player.velocity.x < 0) player.facing = 'left';

  if (enemy.velocity.x > 0) enemy.facing = 'right';
  else if (enemy.velocity.x < 0) enemy.facing = 'left';

  // Detect Collisions
  if (rectangularCollision({ rectangle1: player, rectangle2: enemy }) && player.isAttacking && player.attackType) {
    player.isAttacking = false;
    const damage = player.attackData[player.attackType].damage;
    enemy.health = Math.max(0, enemy.health - damage);
    document.querySelector('#enemy-health').style.width = enemy.health + '%';

    // Juice: Particles & Shake
    shake = damage > 10 ? 20 : 5; // Heavy shake for heavy damage
    if (damage > 10) audio.play('hitHeavy');
    else audio.play('hitLight');

    for (let i = 0; i < damage * 2; i++) {
        particles.push(new Particle({
            position: { x: enemy.position.x + enemy.width / 2, y: enemy.position.y + enemy.height / 2 },
            velocity: { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 },
            radius: Math.random() * 3,
            color: 'red' // Blood/Sparks? Maybe grey for appliance debris? Let's use 'orange' for sparks.
        }));
        particles.push(new Particle({
            position: { x: enemy.position.x + enemy.width / 2, y: enemy.position.y + enemy.height / 2 },
            velocity: { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 },
            radius: Math.random() * 2,
            color: '#CCC' // Metal bits
        }));
    }
  }

  if (rectangularCollision({ rectangle1: enemy, rectangle2: player }) && enemy.isAttacking && enemy.attackType) {
    enemy.isAttacking = false;
    const damage = enemy.attackData[enemy.attackType].damage;
    player.health = Math.max(0, player.health - damage);
    document.querySelector('#player-health').style.width = player.health + '%';

    // Juice: Particles & Shake
    shake = damage > 10 ? 20 : 5;
    if (damage > 10) audio.play('hitHeavy');
    else audio.play('hitLight');

    for (let i = 0; i < damage * 2; i++) {
        particles.push(new Particle({
            position: { x: player.position.x + player.width / 2, y: player.position.y + player.height / 2 },
            velocity: { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 },
            radius: Math.random() * 3,
            color: 'orange'
        }));
        particles.push(new Particle({
            position: { x: player.position.x + player.width / 2, y: player.position.y + player.height / 2 },
            velocity: { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 },
            radius: Math.random() * 2,
            color: '#CCC'
        }));
    }
  }

  if (enemy.health <= 0 || player.health <= 0) {
    determineWinner({ player, enemy, timerId });
    gameOver = true;
    audio.play('gameOver');
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
      player.lastKey = 'd';
      break;
    case 'a':
      player.lastKey = 'a';
      break;
    case 'w':
      if (player.velocity.y === 0) {
        player.velocity.y = -20;
        audio.play('jump');
      }
      break;
    case 'j':
      player.attack('light');
      break;
    case 'k':
      player.attack('heavy');
      break;
    case 'l':
      player.attack('special');
      break;

    case 'ArrowRight':
      enemy.lastKey = 'ArrowRight';
      break;
    case 'ArrowLeft':
      enemy.lastKey = 'ArrowLeft';
      break;
    case 'ArrowUp':
      if (gameMode === 'pvp' && enemy.velocity.y === 0) {
        enemy.velocity.y = -20;
        audio.play('jump');
      }
      break;
    // Player 2 Attacks (I, O, P)
    case 'i':
      if (gameMode === 'pvp') enemy.attack('light');
      break;
    case 'o':
      if (gameMode === 'pvp') enemy.attack('heavy');
      break;
    case 'p':
      if (gameMode === 'pvp') enemy.attack('special');
      break;
  }
});
