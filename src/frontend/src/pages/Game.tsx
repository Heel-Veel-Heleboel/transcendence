import { JSX, useEffect, useState } from 'react';
import { Scene } from '@babylonjs/core';
import SceneComponent from 'babylonjs-hook';
import { GameClient } from '../game-client/systems/GameClient';
import { useRoom } from '../components/providers/Room';
import { Room } from '@colyseus/sdk';
import { ErrorBoundary } from 'react-error-boundary';
import { useParams } from 'react-router-dom';
import { GameCrash } from '../features/errors/GameCrash';


/* v8 ignore start */
// NOTE: potential implementation of tests https://humblesoftware.github.io/js-imagediff/test.html

export function Game(): JSX.Element | null {
    const { gameMode, matchId, roomId } = useParams();

    if (typeof gameMode === 'undefined' || typeof matchId === 'undefined' || typeof roomId === 'undefined')
        throw new Error('uri error');
    console.log(gameMode + ' ' + matchId + ' ' + roomId);
    return (
        <ErrorBoundary FallbackComponent={GameCrash}>
            <GameRender gameMode={gameMode} matchId={matchId} roomId={roomId} />
        </ErrorBoundary>
    )
}

export function GameRender({ gameMode, matchId, roomId }: { gameMode: string, matchId: string, roomId: string }): JSX.Element | null {
    const [room, setRoom] = useState<Room | null>(null);
    const [game, setGame] = useState<GameClient | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const roomProv = useRoom();

    const onSceneReady = async (scene: Scene) => {
        try {
            setGame(new GameClient(scene, gameMode, matchId, setError))
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
                    if (!game) {
                        throw new Error('game init fail');
                    }
                    game.initRoom(room);
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
            roomProv.join(roomId);
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
