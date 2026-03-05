import { GRAVITY } from './constants.js';

export class Projectile {
  constructor({ position, velocity, color = 'white', width = 26, height = 10, type = 'bolt' }) {
    this.position = position;
    this.velocity = velocity;
    this.color = color;
    this.width = width;
    this.height = height;
    this.type = type;
    this.attackBox = { position: this.position, width: this.width, height: this.height };
  }

  draw(c) {
    c.save();
    if (this.type === 'glyph') {
      c.fillStyle = '#89f8ff';
      c.fillRect(this.position.x, this.position.y, this.width, this.height);
      c.strokeStyle = '#fff';
      c.strokeRect(this.position.x, this.position.y, this.width, this.height);
    } else if (this.type === 'glitch') {
      c.fillStyle = '#ff67df';
      c.fillRect(this.position.x, this.position.y - 2, this.width, this.height + 4);
      c.fillStyle = 'rgba(255,255,255,.8)';
      c.fillRect(this.position.x + 4, this.position.y, this.width - 8, this.height);
    } else if (this.type === 'burst') {
      c.strokeStyle = this.color;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, this.height * 1.4, 0, Math.PI * 2);
      c.stroke();
    } else {
      c.fillStyle = this.color;
      c.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
    c.restore();
  }

  update(c) {
    this.draw(c);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

export class Particle {
  constructor({ position, velocity, radius, color = 'white', fades = true }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.color = color;
    this.opacity = 1;
    this.fades = fades;
  }

  draw(c) {
    c.save();
    c.globalAlpha = this.opacity;
    c.fillStyle = this.color;
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  update(c) {
    this.draw(c);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.velocity.y += GRAVITY * 0.2;
    if (this.fades) this.opacity -= 0.03;
  }
}

export class Fighter {
  constructor({ position, velocity, color, width = 70, height = 110, attackBox, facing = 'right' }) {
    this.position = position;
    this.velocity = velocity;
    this.color = color;
    this.width = width;
    this.height = height;
    this.health = 100;
    this.facing = facing;
    this.initialFacing = facing;
    this.lastKey = undefined;

    this.attackBox = {
      position: { x: this.position.x, y: this.position.y },
      offset: attackBox.offset,
      width: attackBox.width,
      height: attackBox.height
    };

    this.isAttacking = false;
    this.isBlocking = false;
    this.isShooting = false;
    this.isStunned = false;
    this.stunTimer = 0;
    this.attackCooldown = 0;
    this.projectileType = 'normal';
    this.energy = 0;
    this.isOverdrive = false;
    this.overdriveTimer = 0;

    this.projectiles = [];
    this.jumps = 0;
    this.MAX_JUMPS = 2;

    this.focus = 0;
    this.burstCooldown = 0;
  }

  update(c) {
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

    if (this.lastKey === 'd' || this.lastKey === 'ArrowRight') this.facing = 'right';
    if (this.lastKey === 'a' || this.lastKey === 'ArrowLeft') this.facing = 'left';

    const baseOffsetX = this.facing === this.initialFacing
      ? this.attackBox.offset.x
      : this.width - this.attackBox.offset.x - this.attackBox.width;

    this.attackBox.position.x = this.position.x + baseOffsetX;
    this.attackBox.position.y = this.position.y + this.attackBox.offset.y;

    this.position.x += this.velocity.x;
    if (this.position.x < 0) this.position.x = 0;
    if (this.position.x + this.width > c.canvas.width) this.position.x = c.canvas.width - this.width;

    this.position.y += this.velocity.y;
    if (this.position.y + this.height + this.velocity.y >= c.canvas.height - 96) {
      this.velocity.y = 0;
      this.position.y = c.canvas.height - 96 - this.height;
      this.jumps = 0;
    } else {
      this.velocity.y += GRAVITY;
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(c);
      if (p.position.x + p.width < 0 || p.position.x > c.canvas.width) this.projectiles.splice(i, 1);
    }

    this.draw(c);
  }

  draw(c) {
    c.save();
    const bob = this.velocity.y === 0 ? Math.sin(Date.now() / 180 + this.position.x * 0.01) * 1.5 : 0;
    c.translate(this.position.x + this.width / 2, this.position.y + this.height / 2 + bob);
    if ((this.initialFacing === 'right' && this.facing === 'left') || (this.initialFacing === 'left' && this.facing === 'right')) c.scale(-1, 1);
    c.translate(-this.width / 2, -this.height / 2);

    c.fillStyle = this.color;
    c.fillRect(0, 0, this.width, this.height);
    c.restore();

    if (this.isAttacking) {
      c.fillStyle = 'rgba(255,255,255,.25)';
      c.fillRect(this.attackBox.position.x, this.attackBox.position.y, this.attackBox.width, this.attackBox.height);
    }

    if (this.isBlocking) {
      c.strokeStyle = '#74dcff';
      c.lineWidth = 4;
      c.strokeRect(this.position.x - 4, this.position.y - 4, this.width + 8, this.height + 8);
    }
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

  attack() {
    if (this.isStunned || this.isAttacking || this.attackCooldown > 0) return;
    this.isAttacking = true;
    this.attackCooldown = 18;
    setTimeout(() => this.isAttacking = false, 110);
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

export class CursorKnight extends Fighter {
  constructor(props) {
    super({ ...props, color: '#cce8ff', width: 72, height: 110, facing: 'right' });
  }

  draw(c) {
    c.save();
    c.translate(this.position.x + this.width / 2, this.position.y + this.height / 2);
    if (this.facing === 'left') c.scale(-1, 1);
    c.translate(-this.width / 2, -this.height / 2);

    c.fillStyle = '#d7ebff';
    c.fillRect(0, 0, this.width, this.height);
    c.fillStyle = '#2b4f7c';
    c.fillRect(16, 18, this.width - 32, this.height - 36);
    c.fillStyle = '#aaf5ff';
    c.fillRect(this.width - 16, 35, 12, 40);
    c.fillStyle = '#ffffff';
    c.fillRect(8, 10, this.width - 20, 8);
    c.restore();

    if (this.isAttacking) {
      c.fillStyle = 'rgba(137, 248, 255, .45)';
      c.fillRect(this.attackBox.position.x, this.attackBox.position.y, this.attackBox.width, this.attackBox.height);
    }
    if (this.isBlocking) {
      c.strokeStyle = '#89f8ff';
      c.lineWidth = 4;
      c.strokeRect(this.position.x - 4, this.position.y - 4, this.width + 8, this.height + 8);
    }
  }

  shoot() {
    if (this.isStunned || this.isShooting) return;
    const dir = this.facing === 'left' ? -1 : 1;
    this.projectiles.push(new Projectile({
      position: { x: this.position.x + (dir > 0 ? this.width : -28), y: this.position.y + this.height / 2 - 6 },
      velocity: { x: dir * 9, y: 0 },
      type: 'glyph'
    }));
    this.isShooting = true;
    setTimeout(() => this.isShooting = false, 420);
  }
}

export class GlitchWyrm extends Fighter {
  constructor(props) {
    super({ ...props, color: '#ffd0f8', width: 88, height: 100, facing: 'left' });
  }

  draw(c) {
    c.save();
    c.translate(this.position.x + this.width / 2, this.position.y + this.height / 2);
    if (this.facing === 'right') c.scale(-1, 1);
    c.translate(-this.width / 2, -this.height / 2);

    c.fillStyle = '#ffe1fb';
    c.fillRect(0, 8, this.width, this.height - 8);
    c.fillStyle = '#5b2966';
    c.fillRect(8, 18, this.width - 16, this.height - 24);
    c.fillStyle = '#ff72e0';
    for (let i = 0; i < 4; i++) c.fillRect(12 + i * 16, 26 + (i % 2) * 9, 10, 10);
    c.restore();

    if (this.isAttacking) {
      c.fillStyle = 'rgba(255, 114, 224, .45)';
      c.fillRect(this.attackBox.position.x, this.attackBox.position.y, this.attackBox.width, this.attackBox.height);
    }
    if (this.isBlocking) {
      c.strokeStyle = '#ff72e0';
      c.lineWidth = 4;
      c.strokeRect(this.position.x - 4, this.position.y - 4, this.width + 8, this.height + 8);
    }
  }

  shoot() {
    if (this.isStunned || this.isShooting) return;
    const dir = this.facing === 'left' ? -1 : 1;
    this.projectiles.push(new Projectile({
      position: { x: this.position.x + (dir > 0 ? this.width : -30), y: this.position.y + this.height / 2 - 8 },
      velocity: { x: dir * 9, y: 0 },
      type: 'glitch'
    }));
    this.isShooting = true;
    setTimeout(() => this.isShooting = false, 460);
  }
}
