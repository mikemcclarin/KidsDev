import Entity from '../Entity.js';
import Trait from '../Trait.js';
import Killable from '../traits/Killable.js';
import PendulumMove from '../traits/PendulumMove.js';
import Physics from '../traits/Physics.js';
import Player from '../traits/Player.js';
import Solid from '../traits/Solid.js';
import {loadSpriteSheet} from '../loaders/sprite.js';

export function loadMushroom() {
    return loadSpriteSheet('mushroom')
        .then(createMushroomFactory);
}

class Behavior extends Trait {
    collides(us, them) {
        if (us.traits.get(Killable).dead) {
            return;
        }

        if (them.traits.has(Player)) {
            if (them.powerUp) {
                them.powerUp();
            }
            us.traits.get(Killable).kill();
        }
    }
}

function createMushroomFactory(sprite) {
    const walkAnim = sprite.animations.get('walk');

    function drawMushroom(context) {
        sprite.draw(walkAnim(this.lifetime), context, 0, 0);
    }

    return function createMushroom() {
        const mushroom = new Entity();
        mushroom.size.set(16, 16);

        mushroom.addTrait(new Physics());
        mushroom.addTrait(new Solid());
        mushroom.addTrait(new PendulumMove());
        mushroom.addTrait(new Behavior());
        mushroom.addTrait(new Killable());

        mushroom.draw = drawMushroom;

        return mushroom;
    };
}
