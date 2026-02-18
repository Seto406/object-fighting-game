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
    document.querySelector('#display-text').style.display = 'flex';
    if (player.health === enemy.health) {
        document.querySelector('#display-text').innerHTML = 'Tie';
    } else if (player.health > enemy.health) {
        document.querySelector('#display-text').innerHTML = 'Player 1 Wins';
    } else if (player.health < enemy.health) {
        document.querySelector('#display-text').innerHTML = 'Player 2 Wins';
    }
}
