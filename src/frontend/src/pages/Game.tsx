import { JSX, useEffect, useState } from 'react';
import { Scene } from '@babylonjs/core';
import SceneComponent from 'babylonjs-hook';
import { GameClient } from '../game_client/systems/gameClient';
import { useRoom } from '../components/RoomProvider';
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
                console.log('game:');
                console.log(game);
                await game?.initGame();
                game?.initRoom(room);
            }
        };
        if (room) {
            console.log('room:');
            console.log(room);

            initializeGame();
        }

    }, [room]);

    useEffect(() => {
        if (roomProv) {
            roomProv.join();
            const room = roomProv.room;
            setRoom(room);
            console.log('roomProvider:');
            console.log(roomProv);
        }
    }, [roomProv]);

    return (
        <div id="Game" className="h-full w-full">
            <SceneComponent id='game-canvas' antialias onSceneReady={onSceneReady} onRender={onRender} adaptToDeviceRatio className="h-full w-full" />
        </div>
    );
}


/* v8 ignore stop */
