import { JSX } from 'react';
import { Scene } from '@babylonjs/core';
import SceneComponent from 'babylonjs-hook';
import { GameClient } from '../game_client/systems/gameClient';


/* v8 ignore start */
// NOTE: potential implementation of tests https://humblesoftware.github.io/js-imagediff/test.html

export const Game = (): JSX.Element | null => {
    return (
        <div id="Game" className="h-full w-full">
            <SceneComponent id='game-canvas' antialias onSceneReady={onSceneReady} onRender={onRender} adaptToDeviceRatio className="h-full w-full" />
        </div>
    );
}

const onSceneReady = async (scene: Scene) => {
    const game = new GameClient(scene);
    await game.initGame();
}

/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
const onRender = (scene: Scene) => {
    // if (box !== undefined) {
    //     var deltaTimeInMillis = scene.getEngine().getDeltaTime();
    //
    //     const rpm = 10;
    //     box.rotation.y += ((rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000));
    // }
}

/* v8 ignore stop */
