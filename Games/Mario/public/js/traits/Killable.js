import Trait from '../Trait.js';

export default class Killable extends Trait {
    static EVENT_KILL = Symbol('kill');

    constructor() {
        super();
        this.dead = false;
        this.deadTime = 0;
        this.removeAfter = 2;
    }

    kill() {
        this.queue(() => {
            this.dead = true;
            this.deadTime = 0;
        });
    }

    revive() {
        this.dead = false;
        this.deadTime = 0;
    }

    update(entity, {deltaTime}, level) {
        if (this.dead) {
            if (this.deadTime === 0) {
                entity.events.emit(Killable.EVENT_KILL, entity, level);
            }
            this.deadTime += deltaTime;
            if (this.deadTime > this.removeAfter) {
                this.queue(() => {
                    level.entities.delete(entity);
                });
            }
        }
    }
}
