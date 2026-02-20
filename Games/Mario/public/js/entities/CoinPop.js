import Entity from '../Entity.js';
import Gravity from '../traits/Gravity.js';
import LifeLimit from '../traits/LifeLimit.js';
import Velocity from '../traits/Velocity.js';
import {loadSpriteSheet} from '../loaders/sprite.js';

export function loadCoinPop() {
    return loadSpriteSheet('overworld')
    .then(sprite => createFactory(sprite));
}

function createFactory(sprite) {
    function draw(context) {
        sprite.drawAnim('coin', context, 0, 0, this.lifetime);
    }

    return function createCoinPop() {
        const entity = new Entity();
        entity.size.set(16, 16);

        const lifeLimit = new LifeLimit();
        lifeLimit.time = 0.4;

        entity.addTrait(lifeLimit);
        entity.addTrait(new Gravity());
        entity.addTrait(new Velocity());
        entity.draw = draw;

        return entity;
    };
}
