import { JSX, useEffect, useState } from 'react';
import { Scene } from '@babylonjs/core';
import SceneComponent from 'babylonjs-hook';
import { GameClient } from '../game-client/systems/GameClient';
import { useRoom } from '../components/providers/Room';
import { Room } from '@colyseus/sdk';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate, useParams } from 'react-router-dom';
import { GameFallback } from '../features/errors/GameFallBack';
import { HOME_NAVIGATION } from '../shared/constants/navigation';


/* v8 ignore start */

export function Game(): JSX.Element | null {
    const { gameMode, matchId, roomId } = useParams();
    const navigate = useNavigate();

    if (typeof gameMode === 'undefined' || typeof matchId === 'undefined' || typeof roomId === 'undefined') {
        alert('Invalid page access');
        navigate(HOME_NAVIGATION);
        return null;
    }

    return (
        <ErrorBoundary FallbackComponent={GameFallback}>
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
            setError(new Error('0'))
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
                    throw new Error('game init fail');
                } catch (e: any) {
                    console.error(e);
                    setError(new Error('0'))
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
        if (error) {
            room?.send('client-error', { payload: 'crash' });
            if (error.message === '0') {
                throw error
            }
            else {
                throw new Error('1');
            }
        }
        if (roomProv?.error) {
            throw new Error(String(roomProv.error))
        }
    }, [error, roomProv?.error]);

    return (
        <div id='game-container' className="h-full w-full">
            <SceneComponent id='game-canvas' antialias onSceneReady={onSceneReady} onRender={onRender} adaptToDeviceRatio className="h-full w-full" />
        </div>
    );
}


/* v8 ignore stop */
