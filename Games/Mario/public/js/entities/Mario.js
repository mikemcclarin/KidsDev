import Entity from '../Entity.js';
import Go from '../traits/Go.js';
import Jump from '../traits/Jump.js';
import Killable from '../traits/Killable.js';
import Physics from '../traits/Physics.js';
import PipeTraveller from '../traits/PipeTraveller.js';
import PoleTraveller from '../traits/PoleTraveller.js';
import Solid from '../traits/Solid.js';
import Stomper from '../traits/Stomper.js';
import Trait from '../Trait.js';
import {loadAudioBoard} from '../loaders/audio.js';
import {loadSpriteSheet} from '../loaders/sprite.js';

const SLOW_DRAG = 1/1000;
const FAST_DRAG = 1/5000;

class HurtProtect extends Trait {
    constructor() {
        super();
        this.timer = 0;
        this.growTimer = 0;
    }

    update(entity, {deltaTime}) {
        if (this.timer > 0) {
            this.timer -= deltaTime;
        }
        if (this.growTimer > 0) {
            this.growTimer -= deltaTime;
        }
    }
}

export function loadMario(audioContext) {
    return Promise.all([
        loadSpriteSheet('mario'),
        loadAudioBoard('mario', audioContext),
    ])
    .then(([sprite, audio]) => {
        return createMarioFactory(sprite, audio);
    });
}

function createMarioFactory(sprite, audio) {
    const runAnim = sprite.animations.get('run');
    const runLargeAnim = sprite.animations.get('run-large');
    const climbAnim = sprite.animations.get('climb');

    function getHeading(mario) {
        if (mario.traits.get(Killable).dead) {
            return false;
        }
        const poleTraveller = mario.traits.get(PoleTraveller);
        if (poleTraveller.distance) {
            return false;
        }
        return mario.traits.get(Go).heading < 0;
    }

    function routeFrame(mario) {
        if (mario.traits.get(Killable).dead) {
            return 'die';
        }

        const protect = mario.traits.get(HurtProtect);
        if (protect.growTimer > 0) {
            // Alternate between small and large idle frames to show growing
            return Math.floor(protect.growTimer * 12) % 2 === 0 ? 'idle-large' : 'idle';
        }

        const isLarge = mario.powerState === 'large';

        const pipeTraveller = mario.traits.get(PipeTraveller);
        if (pipeTraveller.movement.x != 0) {
            return isLarge ? runLargeAnim(pipeTraveller.distance.x * 2) : runAnim(pipeTraveller.distance.x * 2);
        }
        if (pipeTraveller.movement.y != 0) {
            return isLarge ? 'idle-large' : 'idle';
        }

        const poleTraveller = mario.traits.get(PoleTraveller);
        if (poleTraveller.distance) {
            return climbAnim(poleTraveller.distance);
        }

        if (mario.traits.get(Jump).falling) {
            return isLarge ? 'jump-large' : 'jump';
        }

        const go = mario.traits.get(Go);
        if (go.distance > 0) {
            if ((mario.vel.x > 0 && go.dir < 0) || (mario.vel.x < 0 && go.dir > 0)) {
                return isLarge ? 'break-large' : 'break';
            }

            return isLarge ? runLargeAnim(mario.traits.get(Go).distance) : runAnim(mario.traits.get(Go).distance);
        }

        return isLarge ? 'idle-large' : 'idle';
    }

    function setTurboState(turboOn) {
        this.traits.get(Go).dragFactor = turboOn ? FAST_DRAG : SLOW_DRAG;
    }

    function powerUp() {
        if (this.powerState === 'small') {
            this.powerState = 'large';
            this.size.set(14, 28);
            this.pos.y -= 12;
            this.traits.get(HurtProtect).growTimer = 0.5;
            this.sounds.add('power-up-consume');
        }
    }

    function hurt() {
        const protect = this.traits.get(HurtProtect);
        if (protect.timer > 0) {
            return;
        }
        if (this.powerState === 'large') {
            this.powerState = 'small';
            this.size.set(14, 16);
            this.pos.y += 12;
            protect.timer = 2.0;
        } else {
            this.traits.get(Killable).kill();
        }
    }

    function drawMario(context) {
        // Flash during hurt invincibility
        const protect = this.traits.get(HurtProtect);
        if (protect.timer > 0 && Math.floor(this.lifetime * 15) % 2 === 0) {
            return;
        }
        sprite.draw(routeFrame(this), context, 0, 0, getHeading(this));
    }

    return function createMario() {
        const mario = new Entity();
        mario.audio = audio;
        mario.size.set(14, 16);
        mario.powerState = 'small';

        mario.addTrait(new Physics());
        mario.addTrait(new Solid());
        mario.addTrait(new Go());
        mario.addTrait(new Jump());
        mario.addTrait(new Killable());
        mario.addTrait(new Stomper());
        mario.addTrait(new PipeTraveller());
        mario.addTrait(new PoleTraveller());
        mario.addTrait(new HurtProtect());

        mario.traits.get(Killable).removeAfter = Infinity;
        mario.traits.get(Jump).velocity = 175;

        // On death: bounce up, disable tile collision, reset power state
        mario.traits.get(Killable).listen(Killable.EVENT_KILL, (entity) => {
            entity.vel.y = -600;
            entity.traits.get(Solid).obstructs = false;
            entity.powerState = 'small';
            entity.size.set(14, 16);
        });

        mario.turbo = setTurboState;
        mario.powerUp = powerUp;
        mario.hurt = hurt;
        mario.draw = drawMario;

        mario.turbo(false);

        return mario;
    }
}
