import { Sides } from '../Entity.js';
import Player from '../traits/Player.js';

function handleX({entity, match}) {
    if (entity.vel.x > 0) {
        if (entity.bounds.right > match.x1) {
            entity.obstruct(Sides.RIGHT, match);
        }
    } else if (entity.vel.x < 0) {
        if (entity.bounds.left < match.x2) {
            entity.obstruct(Sides.LEFT, match);
        }
    }
}

function handleY({entity, match, resolver, gameContext, level}) {
    if (entity.vel.y > 0) {
        if (entity.bounds.bottom > match.y1) {
            entity.obstruct(Sides.BOTTOM, match);
        }
    } else if (entity.vel.y < 0) {
        if (entity.traits.has(Player)) {
            const player = entity.traits.get(Player);
            player.addCoins(1);

            // Replace only this cell — don't mutate the shared tile reference
            const grid = resolver.matrix;
            grid.set(match.indexX, match.indexY, { style: 'metal', behavior: 'ground' });

            // Spawn coin pop animation above the block
            const coin = gameContext.entityFactory.coinPop();
            coin.pos.set(match.x1, match.y1 - 16);
            coin.vel.set(0, -300);
            level.entities.add(coin);
        }

        if (entity.bounds.top < match.y2) {
            entity.obstruct(Sides.TOP, match);
        }
    }
}

export const chance = [handleX, handleY];
