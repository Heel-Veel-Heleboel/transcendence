import { JSX, useEffect, useState } from 'react';
import { Scene } from '@babylonjs/core';
import SceneComponent from 'babylonjs-hook';
import { GameClient } from '../game-client/systems/GameClient';
import { useRoom } from '../components/providers/Room';
import { Room } from '@colyseus/sdk';
import { ErrorBoundary } from 'react-error-boundary';
import { GameCrash } from '../components/errors/GameCrash';
import { useParams } from 'react-router-dom';


/* v8 ignore start */
// NOTE: potential implementation of tests https://humblesoftware.github.io/js-imagediff/test.html

export const Game = (): JSX.Element | null => {
    const { gameMode, matchId, roomId } = useParams();
    console.log(gameMode + ' ' + matchId + ' ' + roomId);
    return (
        <ErrorBoundary FallbackComponent={GameCrash}>
            <GameRender />
        </ErrorBoundary>
    )
}

export const GameRender = (): JSX.Element | null => {
    const [room, setRoom] = useState<Room | null>(null);
    const [game, setGame] = useState<GameClient | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const roomProv = useRoom();

    const onSceneReady = async (scene: Scene) => {
        try {
            setGame(new GameClient(scene, setError))
        } catch (e: any) {
            console.error(e);
            setError(new Error('game-client construction error'))
        }
    }

    const onRender = (_scene: Scene) => { }

    useEffect(() => {
        const initializeGame = async () => {
            if (room) {
                try {
                    await game?.initGame();
                    game?.initRoom(room);
                } catch (e: any) {
                    console.error(e);
                    setError(new Error('game initialization error'));
                }
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

    useEffect(() => {
        // NOTE: disconnect from room with crashcode
        //  game-server will report crash to matchmaking
    }, [error]);

    if (error) {
        throw error;
    }
    return (
        <div className="h-full w-full">
            <SceneComponent id='game-canvas' antialias onSceneReady={onSceneReady} onRender={onRender} adaptToDeviceRatio className="h-full w-full" />
        </div>
    );
}


/* v8 ignore stop */
