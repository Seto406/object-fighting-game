import { audio } from './audio.js';

const gravity = 0.7;

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
        facing = 'right',
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
        this.facing = facing;
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
        this.attackType = null;
        this.health = 100;
        this.framesCurrent = 0;
        this.framesElapsed = 0;
        this.framesHold = 5;
        this.sprites = sprites;
        this.dead = false;

        this.attackData = {
            light: { damage: 5, duration: 100, cooldown: 200, color: 'yellow', width: 100, height: 50 },
            heavy: { damage: 15, duration: 300, cooldown: 600, color: 'orange', width: 150, height: 50 },
            special: { damage: 25, duration: 500, cooldown: 1000, color: 'purple', width: 200, height: 100 }
        };
        this.lastAttackTime = { light: 0, heavy: 0, special: 0 };

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
            this.velocity.y += gravity;
        }
    }

    attack(type = 'light') {
        const now = Date.now();
        if (this.isAttacking || now - this.lastAttackTime[type] < this.attackData[type].cooldown) return;

        this.isAttacking = true;
        this.attackType = type;
        this.lastAttackTime[type] = now;

        // Adjust attack box based on type
        this.attackBox.width = this.attackData[type].width;
        this.attackBox.height = this.attackData[type].height;

        // Adjust offset based on facing direction
        if (this.facing === 'left') {
            this.attackBox.offset.x = -this.attackBox.width;
        } else {
            this.attackBox.offset.x = this.width;
        }

        // Play sound
        if (type === 'special') audio.play('attackSpecial');
        else if (type === 'heavy') audio.play('attackHeavy');
        else audio.play('attackLight');

        // Apply custom offsets from attack data
        if (this.attackData[type].offset) {
            this.attackBox.offset.x += (this.attackData[type].offset.x || 0);
            this.attackBox.offset.y = (this.attackData[type].offset.y || 0);
        } else {
            this.attackBox.offset.y = 0;
        }

        setTimeout(() => {
            this.isAttacking = false;
            this.attackType = null;
            this.attackBox.offset.y = 0; // Reset Y offset
        }, this.attackData[type].duration);
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
                c.fillStyle = this.attackData[this.attackType] ? this.attackData[this.attackType].color : 'green';
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
        this.attackData = {
            light: { damage: 8, duration: 150, cooldown: 300, color: 'yellow', width: 100, height: 50 },
            heavy: { damage: 20, duration: 300, cooldown: 800, color: 'orange', width: 140, height: 60 },
            special: { damage: 30, duration: 400, cooldown: 2000, color: 'red', width: 100, height: 300, offset: { y: -200 } } // Vertical Pop
        };
    }

    draw(c) {
        // Draw Body
        c.fillStyle = this.color;
        c.fillRect(this.position.x, this.position.y, this.width, this.height);

        // Draw Slots
        c.fillStyle = '#333';
        c.fillRect(this.position.x + 15, this.position.y, 10, 20);
        c.fillRect(this.position.x + 35, this.position.y, 10, 20);

        // Draw Heating Elements inside slots
        if (this.isAttacking) {
            c.fillStyle = 'orange'; // Glowing coils
            c.fillRect(this.position.x + 17, this.position.y + 2, 6, 16);
            c.fillRect(this.position.x + 37, this.position.y + 2, 6, 16);
        }

        // Draw Lever
        c.fillStyle = '#000';
        c.fillRect(this.position.x + this.width, this.position.y + 30, 10, 10);

        // Lever Knob
        c.fillStyle = this.isAttacking ? 'red' : '#333';
        c.beginPath();
        c.arc(this.position.x + this.width + 5, this.position.y + 35, 8, 0, Math.PI * 2);
        c.fill();

        // Attack Box
        if (this.isAttacking) {
             c.fillStyle = this.attackData[this.attackType] ? this.attackData[this.attackType].color : 'orange';
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
        this.attackData = {
            light: { damage: 6, duration: 100, cooldown: 250, color: 'cyan', width: 110, height: 50, offset: { y: 25 } },
            heavy: { damage: 25, duration: 500, cooldown: 1200, color: 'blue', width: 200, height: 100 },
            special: { damage: 20, duration: 600, cooldown: 3000, color: 'green', width: 400, height: 60, offset: { y: 20 } } // Beam
        };
    }

    draw(c) {
        // Draw Body
        c.fillStyle = this.color;
        c.fillRect(this.position.x, this.position.y, this.width, this.height);

        // Draw Window
        c.fillStyle = this.isAttacking ? '#444' : '#222'; // Dark glass, lighter when active
        c.fillRect(this.position.x + 5, this.position.y + 15, this.width - 25, this.height - 30);

        // Draw Spinning Plate (simple line or oval)
        if (this.isAttacking) {
            c.fillStyle = 'rgba(200, 200, 255, 0.5)';
            c.beginPath();
            c.ellipse(this.position.x + (this.width - 25) / 2 + 5, this.position.y + this.height - 25, 20, 5, 0, 0, Math.PI * 2);
            c.fill();
        }

        // Draw Control Panel
        c.fillStyle = '#CCC';
        c.fillRect(this.position.x + this.width - 20, this.position.y + 10, 15, this.height - 20);

        // Draw Buttons
        c.fillStyle = '#000';
        c.fillRect(this.position.x + this.width - 15, this.position.y + 25, 5, 5);
        c.fillRect(this.position.x + this.width - 15, this.position.y + 40, 5, 5);
        c.fillRect(this.position.x + this.width - 15, this.position.y + 55, 5, 5);

        // Digital Clock
        c.fillStyle = 'lime';
        c.font = '8px Arial';
        c.fillText(this.isAttacking ? '99:99' : '12:00', this.position.x + this.width - 18, this.position.y + 20);


        // Attack Box
        if (this.isAttacking) {
             c.fillStyle = this.attackData[this.attackType] ? this.attackData[this.attackType].color : 'cyan';
             c.fillRect(
                this.attackBox.position.x,
                this.attackBox.position.y,
                this.attackBox.width,
                this.attackBox.height
            );
        }
    }
}
