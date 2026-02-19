export function rectangularCollision({ rectangle1, rectangle2 }) {
  return (
    rectangle1.attackBox.position.x + rectangle1.attackBox.width >= rectangle2.position.x &&
    rectangle1.attackBox.position.x <= rectangle2.position.x + rectangle2.width &&
    rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y &&
    rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
  );
}

export function determineWinner({ player, enemy, timerId }) {
  clearTimeout(timerId);
  if (player.health === enemy.health) {
    return 'Tie';
  } else if (player.health > enemy.health) {
    return 'Player 1 Wins';
  } else if (player.health < enemy.health) {
    return 'Player 2 Wins';
  }
}

export function drawBackground(c, canvas) {
    // Gradient Background (Wall)
    const gradient = c.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.7, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    c.fillStyle = gradient;
    c.fillRect(0, 0, canvas.width, canvas.height);

    // Floor
    c.fillStyle = '#0f3460';
    c.fillRect(0, canvas.height - 96, canvas.width, 96);

    // Floor Grid (Perspective)
    c.save();
    c.strokeStyle = '#e94560';
    c.lineWidth = 1;
    c.globalAlpha = 0.3;
    c.beginPath();
    // Horizontal lines
    for (let y = canvas.height - 96; y < canvas.height; y += 20) {
        c.moveTo(0, y);
        c.lineTo(canvas.width, y);
    }
    // Vertical/Perspective lines
    for (let x = 0; x <= canvas.width; x += 100) {
        c.moveTo(x, canvas.height - 96);
        // Fake perspective: fan out from center bottom slightly?
        // Or just angled lines. Let's do simple angled lines based on center.
        const perspectiveOffset = (x - canvas.width / 2) * 1.5;
        c.lineTo(x + perspectiveOffset, canvas.height);
    }
    c.stroke();
    c.restore();

    // Background Counter top
    c.fillStyle = '#222';
    c.fillRect(0, canvas.height - 150, canvas.width, 20);
    c.fillStyle = '#333'; // Shadow under counter
    c.fillRect(0, canvas.height - 130, canvas.width, 10);

    // Window
    c.fillStyle = '#050510'; // Dark outside
    c.fillRect(canvas.width / 2 - 150, 100, 300, 200);
    c.strokeStyle = '#333';
    c.lineWidth = 5;
    c.strokeRect(canvas.width / 2 - 150, 100, 300, 200); // Frame

    // Moon
    c.fillStyle = '#eee';
    c.shadowBlur = 20;
    c.shadowColor = '#fff';
    c.beginPath();
    c.arc(canvas.width / 2 + 80, 150, 30, 0, Math.PI * 2);
    c.fill();
    c.shadowBlur = 0;

    // Window panes
    c.strokeStyle = '#333';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(canvas.width / 2, 100);
    c.lineTo(canvas.width / 2, 300);
    c.moveTo(canvas.width / 2 - 150, 200);
    c.lineTo(canvas.width / 2 + 150, 200);
    c.stroke();

    // Reflection on floor
    c.save();
    c.globalAlpha = 0.1;
    c.fillStyle = '#e94560'; // Neon reflection
    c.fillRect(100, canvas.height - 80, 200, 10);
    c.fillRect(700, canvas.height - 50, 150, 5);
    c.restore();
}
