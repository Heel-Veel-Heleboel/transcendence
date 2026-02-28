import { JSX, useEffect, useState } from 'react';
import { Scene } from '@babylonjs/core';
import SceneComponent from 'babylonjs-hook';
import { GameClient } from '../game-client/systems/GameClient';
import { useRoom } from '../components/providers/Room';
import { Room } from '@colyseus/sdk';


/* v8 ignore start */
// NOTE: potential implementation of tests https://humblesoftware.github.io/js-imagediff/test.html

export const Game = (): JSX.Element | null => {
    const [room, setRoom] = useState<Room | null>(null);
    const [game, setGame] = useState<GameClient | null>(null);
    const roomProv = useRoom();

    const onSceneReady = async (scene: Scene) => {
        setGame(new GameClient(scene))
    }

    const onRender = (_scene: Scene) => { }

    useEffect(() => {
        const initializeGame = async () => {
            if (room) {
                await game?.initGame();
                game?.initRoom(room);
            }
        };
        if (room) {
            initializeGame();
        }

    }, [room]);

    useEffect(() => {
        if (roomProv) {
            roomProv.join();
            const room = roomProv.room;
            setRoom(room);
        }
    }, [roomProv]);

    return (
        <div className="h-full w-full">
            <SceneComponent id='game-canvas' antialias onSceneReady={onSceneReady} onRender={onRender} adaptToDeviceRatio className="h-full w-full" />
        </div>
    );
}


/* v8 ignore stop */
