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
    const t = Date.now() * 0.001;
    const gradient = c.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#100b2b');
    gradient.addColorStop(0.5, '#1c1451');
    gradient.addColorStop(1, '#0a0720');
    c.fillStyle = gradient;
    c.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 40; i++) {
        const x = (i * 137) % canvas.width;
        const y = 40 + ((i * 83) % 200);
        const pulse = 0.3 + Math.sin(t * 2 + i) * 0.2;
        c.fillStyle = `rgba(255,255,255,${pulse})`;
        c.fillRect(x, y, 2, 2);
    }

    c.fillStyle = '#191032';
    c.fillRect(0, canvas.height - 180, canvas.width, 84);

    c.fillStyle = '#0b0f2a';
    c.fillRect(0, canvas.height - 96, canvas.width, 96);

    c.save();
    c.strokeStyle = '#00cfff';
    c.globalAlpha = 0.22;
    c.lineWidth = 1;
    c.beginPath();
    for (let y = canvas.height - 96; y < canvas.height; y += 18) {
        c.moveTo(0, y);
        c.lineTo(canvas.width, y);
    }
    for (let x = 0; x <= canvas.width; x += 80) {
        c.moveTo(x, canvas.height - 96);
        const perspectiveOffset = (x - canvas.width / 2) * 1.25;
        c.lineTo(x + perspectiveOffset, canvas.height);
    }
    c.stroke();
    c.restore();

    const crowdY = canvas.height - 190;
    for (let i = 0; i < 24; i++) {
        const x = i * 45;
        const bob = Math.sin(t * 3 + i) * 2;
        c.fillStyle = i % 2 === 0 ? '#ff4de1' : '#3df8ff';
        c.fillRect(x, crowdY + bob, 14, 16);
    }

    c.fillStyle = '#2b1d55';
    c.fillRect(canvas.width / 2 - 170, 76, 340, 220);
    c.strokeStyle = '#8ffffd';
    c.lineWidth = 4;
    c.strokeRect(canvas.width / 2 - 170, 76, 340, 220);

    c.fillStyle = 'rgba(255, 255, 255, 0.10)';
    c.fillRect(canvas.width / 2 - 150, 90, 300, 40);
}
