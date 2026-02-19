import { GRAVITY } from './constants.js';

export class Sprite {
  constructor({ position, imageSrc, scale = 1, framesMax = 1, offset = { x: 0, y: 0 } }) {
    this.position = position;
    this.width = 50;
    this.height = 150;
    this.image = new Image();
    this.image.src = imageSrc;
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
    attackBox = { offset: {}, width: undefined, height: undefined }
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
    this.attackBox = {
      position: {
        x: this.position.x,
        y: this.position.y
      },
      offset: attackBox.offset || { x: 0, y: 0 },
      width: attackBox.width || 100,
      height: attackBox.height || 50
    };
    this.color = color;
    this.isAttacking;
    this.health = 100;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
    this.framesHold = 5;
    this.sprites = sprites;
    this.dead = false;

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

    // Attack boxes
    this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
    this.attackBox.position.y = this.position.y + this.attackBox.offset.y;

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Gravity function
    if (this.position.y + this.height + this.velocity.y >= c.canvas.height - 96) {
      this.velocity.y = 0;
      this.position.y = c.canvas.height - 96 - this.height;
    } else {
      this.velocity.y += GRAVITY;
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
    } else {
      super.draw(c);
    }
  }
}

export class Toaster extends Fighter {
  constructor(props) {
    super(props);
    this.color = '#C0C0C0'; // Silver
    this.width = 60; // Slightly wider
    this.height = 100; // Shorter
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
  }
}

export class Microwave extends Fighter {
  constructor(props) {
    super(props);
    this.color = '#EEE'; // White
    this.width = 80; // Wider
    this.height = 100; // Shorter
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
  }
}
