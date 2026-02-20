import Trait from '../Trait.js';

export default class PoleTraveller extends Trait {
    static EVENT_RIDE_COMPLETE = Symbol('pole ride complete');

    constructor() {
        super();
        this.distance = 0;
        this.riding = false;
    }

    update(entity, gameContext, level) {
        if (this.distance > 0) {
            this.riding = true;
            // Lock velocity so Physics doesn't fight Pole's positioning
            entity.vel.set(0, 0);
        } else if (this.riding) {
            // Transition: was on pole, just reached bottom
            this.riding = false;
            entity.events.emit(PoleTraveller.EVENT_RIDE_COMPLETE, entity, level);
        }
    }
}
