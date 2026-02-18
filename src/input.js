
export class InputHandler {
    constructor() {
        this.keys = {
            // Player 1
            w: { pressed: false },
            a: { pressed: false },
            s: { pressed: false },
            d: { pressed: false },
            j: { pressed: false }, // Light
            k: { pressed: false }, // Heavy
            l: { pressed: false }, // Special

            // Player 2
            ArrowUp: { pressed: false },
            ArrowLeft: { pressed: false },
            ArrowDown: { pressed: false },
            ArrowRight: { pressed: false },
            i: { pressed: false }, // Light (using i/o/p for p2 attack buttons)
            o: { pressed: false }, // Heavy
            p: { pressed: false }  // Special
        };

        window.addEventListener('keydown', (e) => {
            if (this.keys[e.key]) {
                this.keys[e.key].pressed = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys[e.key]) {
                this.keys[e.key].pressed = false;
            }
        });
    }

    isPressed(key) {
        return this.keys[key] && this.keys[key].pressed;
    }
}
