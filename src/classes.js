import { GRAVITY } from './constants.js';

export class Projectile {
  constructor({ position, velocity, color = 'red', width = 20, height = 10 }) {
    this.position = position;
    this.velocity = velocity;
    this.color = color;
    this.width = width;
    this.height = height;
    this.attackBox = {
        position: this.position,
        width: this.width,
        height: this.height
    };
  }

  draw(c) {
    c.fillStyle = this.color;
    c.fillRect(this.position.x, this.position.y, this.width, this.height);
  }

  update(c) {
    this.draw(c);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
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

    // Determine direction
    let currentDir = this.facing;
    if (this.lastKey === 'd' || this.lastKey === 'ArrowRight') currentDir = 'right';
    else if (this.lastKey === 'a' || this.lastKey === 'ArrowLeft') currentDir = 'left';

    // Update Attack Box Offset based on direction
    if (currentDir === this.facing) {
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

  attack() {
    this.isAttacking = true;
    setTimeout(() => {
      this.isAttacking = false;
    }, 100);
  }

  switchSprite(sprite) {
    if (!this.sprites) return;
    if (this.image === this.sprites[sprite].image) return;
    this.image = this.sprites[sprite].image;
    this.framesMax = this.sprites[sprite].framesMax;
    this.framesCurrent = 0;
  }

  draw(c) {
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
     if (this.isShooting) return;

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
        velocity: { x: velocityX, y: 0 },
        color: this.projectileColor || 'black',
        width: 40,
        height: 10
    });
    this.projectiles.push(projectile);

    this.isShooting = true;
    setTimeout(() => this.isShooting = false, 500); // 0.5s Cooldown
  }
}

export class Toaster extends Fighter {
  constructor(props) {
    super({ ...props, facing: 'right' });
    this.color = '#C0C0C0'; // Silver
    this.width = 60; // Slightly wider
    this.height = 100; // Shorter
    this.projectileColor = '#DAA520'; // Golden toast
  }

  draw(c) {
    // Draw Body
    c.fillStyle = this.color;
    c.fillRect(this.position.x, this.position.y, this.width, this.height);

    // Draw Slots
    c.fillStyle = '#333';
    c.fillRect(this.position.x + 15, this.position.y, 10, 20);
    c.fillRect(this.position.x + 35, this.position.y, 10, 20);

    // Draw Lever
    c.fillStyle = '#000';
    c.fillRect(this.position.x + this.width, this.position.y + 30, 10, 10);

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
  }

  draw(c) {
    // Draw Body
    c.fillStyle = this.color;
    c.fillRect(this.position.x, this.position.y, this.width, this.height);

    // Draw Window
    c.fillStyle = '#222'; // Dark glass
    c.fillRect(this.position.x + 5, this.position.y + 15, this.width - 25, this.height - 30);

    // Draw Control Panel
    c.fillStyle = '#CCC';
    c.fillRect(this.position.x + this.width - 20, this.position.y + 10, 15, this.height - 20);

    // Draw Buttons
    c.fillStyle = '#000';
    c.fillRect(this.position.x + this.width - 15, this.position.y + 25, 5, 5);
    c.fillRect(this.position.x + this.width - 15, this.position.y + 40, 5, 5);
    c.fillRect(this.position.x + this.width - 15, this.position.y + 55, 5, 5);


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
