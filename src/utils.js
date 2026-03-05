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
  if (player.health === enemy.health) return 'Draw';
  return player.health > enemy.health ? 'Player 1 Wins' : 'Player 2 Wins';
}

export function drawBackground(c, canvas) {
  const t = Date.now() * 0.001;
  const g = c.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, '#0b1232');
  g.addColorStop(0.6, '#0d1b3f');
  g.addColorStop(1, '#0b0d1f');
  c.fillStyle = g;
  c.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 75; i++) {
    const x = (i * 121) % canvas.width;
    const y = (i * 73) % 250;
    const a = 0.3 + Math.sin(t * 2 + i) * 0.25;
    c.fillStyle = `rgba(180,230,255,${a})`;
    c.fillRect(x, y, 2, 2);
  }

  c.fillStyle = '#191a3f';
  c.fillRect(0, canvas.height - 170, canvas.width, 74);

  c.fillStyle = '#0a122e';
  c.fillRect(0, canvas.height - 96, canvas.width, 96);

  c.save();
  c.strokeStyle = '#64d9ff';
  c.globalAlpha = 0.25;
  c.beginPath();
  for (let y = canvas.height - 96; y <= canvas.height; y += 16) {
    c.moveTo(0, y);
    c.lineTo(canvas.width, y);
  }
  for (let x = 0; x <= canvas.width; x += 85) {
    c.moveTo(x, canvas.height - 96);
    c.lineTo(x + (x - canvas.width / 2) * 1.2, canvas.height);
  }
  c.stroke();
  c.restore();

  c.fillStyle = '#2a2f5d';
  c.fillRect(canvas.width / 2 - 180, 90, 360, 190);
  c.strokeStyle = '#9ce6ff';
  c.lineWidth = 4;
  c.strokeRect(canvas.width / 2 - 180, 90, 360, 190);

  for (let i = 0; i < 28; i++) {
    c.fillStyle = i % 2 ? '#8ee5ff' : '#ff8cee';
    c.fillRect(i * 38, canvas.height - 190 + Math.sin(t * 3 + i) * 2, 12, 14);
  }
}
