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
        function initializeRoom() {
            if (game && room) {
                game.initRoom(room);
            }
        }

        initializeRoom();
    }, [room])

    useEffect(() => {

        async function initializeGame() {
            if (roomProv && game && !roomProv.isConnected) {
                try {
                    await game.initGame();
                    const newRoom = await roomProv.join(roomId);
                    setRoom(newRoom);
                } catch (e: any) {
                    console.error(e);
                    setError(new Error('0'))
                }
            }
        };
        initializeGame();
    }, [roomProv, game]);

    useEffect(() => {
        if (error) {
            if (error.message === '0') {
                room?.send('client-error', { payload: 'init-fail' });
                throw error
            }
            else {
                room?.send('client-error', { payload: 'crash' });
                throw new Error('1');
            }
        }
        if (roomProv?.error) {
            throw new Error(String(roomProv.error))
        }
    }, [error, roomProv?.error]);

    return (
        <div id='game-container' className="h-full w-full">
            <div id='game-loading-screen' className='absolute w-full h-full z-9997'>
                <div id='game-loading-text' className='w-full h-full text-white text-2xl text-center flex flex-col justify-around z-9999'>
                    <div id='game-loading-text-animation'>
                        loading...
                        <img src="/ping-pong.gif"
                            width='200'
                            height='200'
                            alt="ping pong animation"
                            className='ml-auto mr-auto block'
                        />
                    </div>
                </div>
                <div id='game-loading-bg' className='absolute w-full h-full bg-black-600 z-9998 '></div>
            </div>
            <div id='game-reconnection-screen' className='absolute w-full h-full z-9997'>
                <div id='game-reconnection-text' className='w-full h-full text-white text-2xl text-center flex flex-col justify-around z-9999 opacity-100'>
                    <div id='game-reconnection-text-animation'>
                        reconnecting...
                        <img src="/ping-pong.gif"
                            width='200'
                            height='200'
                            alt="ping pong animation"
                            className='ml-auto mr-auto block'
                        />
                    </div>
                </div>
                <div id='game-reconnection-bg' className='absolute w-full h-full bg-gray-500 z-9998 opacity-50'></div>
            </div>
            <SceneComponent id='game-canvas' antialias onSceneReady={onSceneReady} onRender={onRender} adaptToDeviceRatio className="h-full w-full" />
        </div>
    );
}


/* v8 ignore stop */
