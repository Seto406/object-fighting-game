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
    if (this.burstCooldown > 0) this.burstCooldown--;

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

  gainFocus(amount) {
    this.focus = Math.min(100, this.focus + amount);
  }

  burst() {
    if (this.focus < 100 || this.burstCooldown > 0 || this.isStunned) return false;
    this.focus = 0;
    this.burstCooldown = 180;
    const dir = this.facing === 'left' ? -1 : 1;
    this.projectiles.push(new Projectile({
      position: { x: this.position.x + (dir > 0 ? this.width : -10), y: this.position.y + this.height / 2 - 10 },
      velocity: { x: dir * 13, y: 0 },
      width: 34,
      height: 20,
      color: '#ffffff',
      type: 'burst'
    }));
    return true;
  }

  jump() { if (!this.isStunned && this.jumps < this.MAX_JUMPS) { this.velocity.y = -18; this.jumps++; } }

  attack() {
    if (this.isStunned || this.isAttacking || this.attackCooldown > 0) return;
    this.isAttacking = true;
    this.attackCooldown = 18;
    setTimeout(() => this.isAttacking = false, 110);
  }

  shoot() {
    if (this.isStunned || this.isShooting) return;
    const dir = this.facing === 'left' ? -1 : 1;
    this.projectiles.push(new Projectile({
      position: { x: this.position.x + (dir > 0 ? this.width : -28), y: this.position.y + this.height / 2 - 6 },
      velocity: { x: dir * 9, y: 0 },
      width: 26,
      height: 12,
      color: '#fff'
    }));
    this.isShooting = true;
    setTimeout(() => this.isShooting = false, 460);
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
