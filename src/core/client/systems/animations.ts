import * as alt from 'alt-client';
import * as native from 'natives';
import { SYSTEM_EVENTS } from '@AthenaShared/enums/system.js';
import { ANIMATION_FLAGS } from '@AthenaShared/flags/animationFlags.js';

alt.onServer(SYSTEM_EVENTS.PLAYER_EMIT_ANIMATION, playAnimation);

const MaxLoadAttempts = 25;

/**
 * Attempts to load an animation dictionary multiple times before returning false.
 * @param {string} dict The name of the animation dictionary.
 * @param {number} [count=0] Do not modify this. Leave it as zero.
 * @return {Promise<boolean>}
 */
export async function loadAnimation(dict: string, count: number = 0): Promise<boolean> {
    return new Promise((resolve: Function): void => {
        if (native.hasAnimDictLoaded(dict)) {
            resolve(true);
            return;
        }

        const interval = alt.setInterval(() => {
            count += 1;

            if (native.hasAnimDictLoaded(dict)) {
                alt.clearInterval(interval);
                resolve(true);
                return;
            }

            if (count >= MaxLoadAttempts) {
                alt.clearInterval(interval);
                resolve(false);
                return;
            }

            native.requestAnimDict(dict);
        }, 250);
    });
}

/**
 * Play an animation for the local player.
 *
 * @param {string} dict The dictionary of the animation.
 * @param {string} name The name of the animation.
 * @param {ANIMATION_FLAGS} [flags=ANIMATION_FLAGS.CANCELABLE] A combination of flags. ie. (ANIMATION_FLAGS.CANCELABLE | ANIMATION_FLAGS.UPPERBODY_ONLY)
 * @return {Promise<void>}
 */
export async function playAnimation(
    dict: string,
    name: string,
    flags: ANIMATION_FLAGS | number = ANIMATION_FLAGS.CANCELABLE,
    duration: number = -1,
): Promise<void> {
    const isReadyToPlay = await loadAnimation(dict);
    if (!isReadyToPlay) {
        return;
    }

    if (alt.Player.local.meta.isDead) {
        return;
    }

    if (!alt.Player.local || !alt.Player.local.valid) {
        return;
    }

    if (native.isEntityPlayingAnim(alt.Player.local.scriptID, dict, name, 3)) {
        return;
    }

    native.taskPlayAnim(alt.Player.local.scriptID, dict, name, 8.0, -1, duration, flags, 0, false, false, false);
}

/**
 * Play an animation on a Pedestrian
 *
 * @param {number} scriptID
 * @param {string} dict
 * @param {string} name
 * @param {ANIMATION_FLAGS} [flags=ANIMATION_FLAGS.CANCELABLE]
 * @param {number} [duration=-1]
 * @return {void}
 */
export async function playPedAnimation(
    scriptID: number,
    dict: string,
    name: string,
    flags: ANIMATION_FLAGS = ANIMATION_FLAGS.CANCELABLE,
    duration: number = -1,
) {
    const isReadyToPlay = await loadAnimation(dict);
    if (!isReadyToPlay) {
        return;
    }

    if (!scriptID || !native.doesEntityExist(scriptID)) {
        return;
    }

    if (native.isEntityPlayingAnim(scriptID, dict, name, 3)) {
        return;
    }

    native.taskPlayAnim(scriptID, dict, name, 8.0, -1, duration, flags, 0, false, false, false);
}
