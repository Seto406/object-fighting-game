import { GRAVITY } from './constants.js';

export class Projectile {
  constructor({ position, velocity, color = 'red', width = 20, height = 10, type = 'normal' }) {
    this.position = position;
    this.velocity = velocity;
    this.color = color;
    this.width = width;
    this.height = height;
    this.type = type;
    this.attackBox = {
        position: this.position,
        width: this.width,
        height: this.height
    };
    this.timer = 0;
  }

  draw(c) {
    this.timer++;
    if (this.type === 'toast') {
        c.fillStyle = '#f4d03f'; // Toast color
        c.fillRect(this.position.x, this.position.y, this.width, this.height);
        c.strokeStyle = '#d4ac0d';
        c.lineWidth = 2;
        c.strokeRect(this.position.x, this.position.y, this.width, this.height);
        // Crust
        c.fillStyle = '#b7950b';
        c.fillRect(this.position.x + 5, this.position.y + 2, this.width - 10, this.height - 4);
    } else if (this.type === 'wave') {
        c.strokeStyle = 'cyan';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, this.height, -Math.PI / 2, Math.PI / 2, this.velocity.x < 0);
        c.stroke();

        c.strokeStyle = 'white';
        c.lineWidth = 1;
        c.beginPath();
        c.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, this.height - 5, -Math.PI / 2, Math.PI / 2, this.velocity.x < 0);
        c.stroke();
    } else {
        c.fillStyle = this.color;
        c.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
  }

  update(c) {
    this.draw(c);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

export class Particle {
  constructor({ position, velocity, radius, color = 'red', fades = true, type = 'normal' }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.color = color;
    this.opacity = 1;
    this.fades = fades;
    this.ttl = 0;
    this.type = type;
  }

  draw(c) {
    c.save();
    c.globalAlpha = this.opacity;

    if (this.type === 'crumb') {
        c.fillStyle = '#8B4513';
        c.fillRect(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
    } else if (this.type === 'spark') {
        c.strokeStyle = 'white';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(this.position.x, this.position.y);
        c.lineTo(this.position.x + this.velocity.x * 2, this.position.y + this.velocity.y * 2);
        c.stroke();
    } else if (this.type === 'heat') {
        c.fillStyle = this.color;
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
        c.fill();
    } else {
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.closePath();
    }

    c.restore();
  }

  update(c) {
    this.draw(c);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    if (this.type !== 'heat') {
        this.velocity.y += GRAVITY * 0.5;
    }

    if (this.fades) {
        this.opacity -= 0.03;
    }
  }
}

export class Sprite {
  constructor({ position, imageSrc, scale = 1, framesMax = 1, offset = { x: 0, y: 0 } }) {
    this.position = position;
    this.width = 50;
    this.height = 150;
    this.image = new Image();
    if (imageSrc) {
      this.image.src = imageSrc;
    }
    this.scale = scale;
    this.framesMax = framesMax;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
    this.framesHold = 5;
    this.offset = offset;
  }

  draw(c) {
    if (this.image.src && !this.image.src.endsWith('undefined')) {
      c.drawImage(
        this.image,
        this.framesCurrent * (this.image.width / this.framesMax),
        0,
        this.image.width / this.framesMax,
        this.image.height,
        this.position.x - this.offset.x,
        this.position.y - this.offset.y,
        (this.image.width / this.framesMax) * this.scale,
        this.image.height * this.scale
      );
    }
  }

  animateFrames() {
    this.framesElapsed++;

    if (this.framesElapsed % this.framesHold === 0) {
      if (this.framesCurrent < this.framesMax - 1) {
        this.framesCurrent++;
      } else {
        this.framesCurrent = 0;
      }
    }
  }

  update(c) {
    this.draw(c);
  }
}

export class Fighter extends Sprite {
  constructor({
    position,
    velocity,
    color = 'red',
    imageSrc,
    scale = 1,
    framesMax = 1,
    offset = { x: 0, y: 0 },
    sprites,
    attackBox = { offset: {}, width: undefined, height: undefined },
    facing = 'right'
  }) {
    super({
      position,
      imageSrc,
      scale,
      framesMax,
      offset
    });

    this.velocity = velocity;
    this.width = 50;
    this.height = 150;
    this.lastKey;
    this.initialAttackBoxOffset = attackBox.offset || { x: 0, y: 0 };
    this.attackBox = {
      position: {
        x: this.position.x,
        y: this.position.y
      },
      offset: this.initialAttackBoxOffset,
      width: attackBox.width || 100,
      height: attackBox.height || 50
    };
    this.facing = facing; // 'right' or 'left'
    this.initialFacing = facing;
    this.color = color;
    this.isAttacking;
    this.health = 100;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
    this.framesHold = 5;
    this.sprites = sprites;
    this.dead = false;
    this.projectiles = [];
    this.isBlocking = false;
    this.isShooting = false;
    this.jumps = 0;
    this.MAX_JUMPS = 2;
    this.isDashing = false;
    this.dashCooldown = 0;
    this.dashTimer = 0;
    this.isStunned = false;
    this.stunTimer = 0;
    this.attackCooldown = 0;
    this.projectileType = 'normal';
    this.energy = 0;
    this.isOverdrive = false;
    this.overdriveTimer = 0;

    if (this.sprites) {
      for (const sprite in this.sprites) {
        sprites[sprite].image = new Image();
        sprites[sprite].image.src = sprites[sprite].imageSrc;
      }
    }
  }

  update(c) {
    this.draw(c);
    if (!this.dead) this.animateFrames();

    if (this.isStunned) {
        this.stunTimer--;
        if (this.stunTimer <= 0) this.isStunned = false;
    }

    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.isOverdrive) {
        this.overdriveTimer--;
        if (this.overdriveTimer <= 0) this.isOverdrive = false;
    }
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.isDashing) {
        this.dashTimer--;
        if (this.dashTimer <= 0) {
            this.isDashing = false;
            this.velocity.x = 0;
        }
    }

    // Determine direction
    let currentDir = this.facing;
    if (this.lastKey === 'd' || this.lastKey === 'ArrowRight') currentDir = 'right';
    else if (this.lastKey === 'a' || this.lastKey === 'ArrowLeft') currentDir = 'left';

    this.facing = currentDir;

    // Update Attack Box Offset based on direction
    if (this.facing === this.initialFacing) {
        this.attackBox.offset.x = this.initialAttackBoxOffset.x;
    } else {
        // Mirror the offset
        // x = width - initialOffset - attackWidth
        this.attackBox.offset.x = this.width - this.initialAttackBoxOffset.x - this.attackBox.width;
    }

    // Attack boxes
    this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
    this.attackBox.position.y = this.position.y + this.attackBox.offset.y;

    this.position.x += this.velocity.x;

    // Boundary Check
    if (this.position.x < 0) this.position.x = 0;
    if (this.position.x + this.width > c.canvas.width) this.position.x = c.canvas.width - this.width;

    this.position.y += this.velocity.y;

    // Gravity function
    if (this.position.y + this.height + this.velocity.y >= c.canvas.height - 96) {
      this.velocity.y = 0;
      this.position.y = c.canvas.height - 96 - this.height;
      this.jumps = 0;
    } else {
      this.velocity.y += GRAVITY;
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.update(c);
      // Remove if off screen
      if (
        projectile.position.x + projectile.width < 0 ||
        projectile.position.x > c.canvas.width
      ) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  jump() {
    if (this.isStunned) return;
    if (this.jumps < this.MAX_JUMPS) {
      this.velocity.y = -20;
      this.jumps++;
    }
  }

  dash() {
    if (this.isStunned || this.isDashing || this.dashCooldown > 0) return;
    this.isDashing = true;
    this.dashTimer = 10;
    this.dashCooldown = 100;

    let dir = 1;
    if (this.lastKey === 'a' || this.lastKey === 'ArrowLeft') dir = -1;
    else if (this.lastKey === 'd' || this.lastKey === 'ArrowRight') dir = 1;
    else {
        if (this.facing === 'left') dir = -1;
    }

    this.velocity.x = dir * 20;
  }

  attack() {
    if (this.isStunned || this.isAttacking || this.attackCooldown > 0) return;
    this.isAttacking = true;
    this.attackCooldown = this.isOverdrive ? 12 : 20;
    setTimeout(() => {
      this.isAttacking = false;
    }, 100);
  }


  gainEnergy(amount) {
    this.energy = Math.min(100, this.energy + amount);
  }

  activateOverdrive() {
    if (this.energy < 100 || this.isOverdrive || this.isStunned) return false;
    this.energy = 0;
    this.isOverdrive = true;
    this.overdriveTimer = 240;
    return true;
  }

  switchSprite(sprite) {
    if (!this.sprites) return;
    if (this.image === this.sprites[sprite].image) return;
    this.image = this.sprites[sprite].image;
    this.framesMax = this.sprites[sprite].framesMax;
    this.framesCurrent = 0;
  }

  draw(c) {
    if (this.isOverdrive) {
      c.save();
      c.globalAlpha = 0.35;
      c.fillStyle = '#7df9ff';
      c.fillRect(this.position.x - 12, this.position.y - 12, this.width + 24, this.height + 24);
      c.restore();
    }

    // Fallback to rectangle if no image
    if (!this.image.src || this.image.src.endsWith('undefined') || !this.sprites) {
      c.fillStyle = this.color;
      c.fillRect(this.position.x, this.position.y, this.width, this.height);

      // Attack box visual for debugging
      if (this.isAttacking) {
        c.fillStyle = 'green';
        c.fillRect(
          this.attackBox.position.x,
          this.attackBox.position.y,
          this.attackBox.width,
          this.attackBox.height
        );
      }

      // Visual for Blocking
      if (this.isBlocking) {
          c.strokeStyle = 'blue';
          c.lineWidth = 5;
          c.strokeRect(this.position.x - 5, this.position.y - 5, this.width + 10, this.height + 10);
      }

    } else {
      super.draw(c);
       // Visual for Blocking (even with sprites)
       if (this.isBlocking) {
        c.strokeStyle = 'blue';
        c.lineWidth = 5;
        c.strokeRect(this.position.x - 5, this.position.y - 5, this.width + 10, this.height + 10);
      }
    }
  }

  shoot() {
     if (this.isShooting || this.isStunned) return;

    let velocityX = 10;
    // P1 defaults to facing right, P2 defaults to facing left if no key pressed?
    // We can check if lastKey is 'a' or 'ArrowLeft' -> Left
    if (this.lastKey === 'a' || this.lastKey === 'ArrowLeft') {
        velocityX = -10;
    }
    // If no lastKey is set yet (start of game), we might need a default.
    // P1 (Toaster) usually starts on left side (x=200), P2 (Microwave) on right (x=800).
    // So if lastKey is undefined:
    if (!this.lastKey) {
        if (this.position.x > 512) velocityX = -10; // Assume right side player faces left
    }

    const projectile = new Projectile({
        position: {
            x: this.position.x + (velocityX > 0 ? this.width : -40),
            y: this.position.y + this.height / 2 - 10
        },
        velocity: { x: this.isOverdrive ? velocityX * 1.3 : velocityX, y: 0 },
        color: this.projectileColor || 'black',
        width: 40,
        height: 10,
        type: this.projectileType
    });
    this.projectiles.push(projectile);

    this.isShooting = true;
    setTimeout(() => this.isShooting = false, this.isOverdrive ? 280 : 500);
  }
}

export class Toaster extends Fighter {
  constructor(props) {
    super({ ...props, facing: 'right' });
    this.color = '#C0C0C0'; // Silver
    this.width = 60; // Slightly wider
    this.height = 100; // Shorter
    this.projectileColor = '#DAA520'; // Golden toast
    this.projectileType = 'toast';
  }

  draw(c) {
    c.save();
    c.translate(this.position.x + this.width / 2, this.position.y + this.height / 2);

    // Visual Flipping
    if (this.facing === 'left') {
        c.scale(-1, 1);
    }

    let stretch = 0;
    if (this.velocity.y !== 0) {
        stretch = Math.min(Math.abs(this.velocity.y) * 0.02, 0.3);
    }
    if (this.velocity.y === 0 && this.velocity.x === 0) {
        c.translate(0, Math.sin(Date.now() / 200) * 2);
    }

    c.scale(1 - stretch, 1 + stretch);
    c.translate(-this.width / 2, -this.height / 2);

    // Draw Body
    c.fillStyle = this.color;
    c.fillRect(0, 0, this.width, this.height);

    // Draw Slots
    c.fillStyle = '#333';
    c.fillRect(15, 0, 10, 20);
    c.fillRect(35, 0, 10, 20);

    // Coil Glow
    const glow = Math.sin(Date.now() / 100) * 0.5 + 0.5;
    c.fillStyle = `rgba(255, 69, 0, ${glow})`;
    c.fillRect(17, 2, 6, 16);
    c.fillRect(37, 2, 6, 16);

    // Draw Lever
    c.fillStyle = '#000';
    c.fillRect(this.width, 30, 10, 10);

    c.restore();

    // Attack Box
    if (this.isAttacking) {
      c.fillStyle = 'orange'; // Heat
      c.fillRect(
        this.attackBox.position.x,
        this.attackBox.position.y,
        this.attackBox.width,
        this.attackBox.height
      );
    }

    // Blocking
    if (this.isBlocking) {
      c.strokeStyle = '#DAA520'; // Gold shield
      c.lineWidth = 5;
      c.strokeRect(this.position.x - 5, this.position.y - 5, this.width + 10, this.height + 10);
    }
  }

  shoot() {
      // Custom shoot if needed, or use Fighter's with configured color
      super.shoot();
      // We could change shape here if we wanted Projectile to support shapes or custom draw
  }
}

export class Microwave extends Fighter {
  constructor(props) {
    super({ ...props, facing: 'left' });
    this.color = '#EEE'; // White
    this.width = 80; // Wider
    this.height = 100; // Shorter
    this.projectileColor = '#00FFFF'; // Cyan wave
    this.projectileType = 'wave';
  }

  draw(c) {
    c.save();
    c.translate(this.position.x + this.width / 2, this.position.y + this.height / 2);

    // Visual Flipping (Microwave defaults to left)
    if (this.facing === 'right') {
        c.scale(-1, 1);
    }

    let stretch = 0;
    if (this.velocity.y !== 0) {
        stretch = Math.min(Math.abs(this.velocity.y) * 0.02, 0.3);
    }
    if (this.velocity.y === 0 && this.velocity.x === 0) {
        c.translate(0, Math.sin(Date.now() / 200) * 2);
    }

    c.scale(1 - stretch, 1 + stretch);
    c.translate(-this.width / 2, -this.height / 2);

    // Draw Body
    c.fillStyle = this.color;
    c.fillRect(0, 0, this.width, this.height);

    // Draw Window
    c.fillStyle = '#222';
    c.fillRect(5, 15, this.width - 25, this.height - 30);

    // Turntable
    c.fillStyle = '#444';
    c.beginPath();
    c.ellipse(30, 70, 20, 5, 0, 0, Math.PI * 2);
    c.fill();

    // Light inside
    if (Math.random() > 0.9) {
        c.fillStyle = 'rgba(255, 255, 200, 0.1)';
        c.fillRect(5, 15, this.width - 25, this.height - 30);
    }

    // Draw Control Panel
    c.fillStyle = '#CCC';
    c.fillRect(this.width - 20, 10, 15, this.height - 20);

    // Draw Buttons
    c.fillStyle = '#000';
    c.fillRect(this.width - 15, 25, 5, 5);
    c.fillRect(this.width - 15, 40, 5, 5);
    c.fillRect(this.width - 15, 55, 5, 5);

    c.restore();

    // Attack Box
    if (this.isAttacking) {
      c.fillStyle = 'cyan'; // Radiation
      c.fillRect(
        this.attackBox.position.x,
        this.attackBox.position.y,
        this.attackBox.width,
        this.attackBox.height
      );
    }

    // Blocking
    if (this.isBlocking) {
        c.strokeStyle = '#00FFFF'; // Cyan shield
        c.lineWidth = 5;
        c.strokeRect(this.position.x - 5, this.position.y - 5, this.width + 10, this.height + 10);
      }
  }
}
