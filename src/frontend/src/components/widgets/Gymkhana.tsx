import { Dispatch, JSX, SetStateAction, useState } from "react"
import { LobbyRoom } from "../utils/MenuUtils"

import { Client } from "@colyseus/sdk";
import { useLobbyRoom } from "@colyseus/react";
import api from "../../api";
import { CONFIG } from "../../constants/AppConfig";
import { ERRORS } from "../../constants/Errors";

const client = new Client("ws://localhost:2567");


/* v8 ignore start */
export function Gymkhana(): JSX.Element {
    return (

        <div id={CONFIG.MATCHMAKING_CONTAINER_ID} className="h-9/10 flex flex-col">
            <div className="min-h-1/4 flex">
                <JoinSingleGames />
                <JoinTournamentGames />
            </div>
            <div id='GamesPanel' className="w-full min-h-3/4 flex">
                <div className="min-h-full w-1/2">
                    <LobbyRoom title="Current Games" gamesContent={Lobby()} />
                </div>
                <div className="min-h-full w-1/2">
                    <LobbyRoom title="Open Tournaments" gamesContent={Lobby()} />
                </div>
            </div>
        </div>
    );
}

export function JoinTournamentGames(): JSX.Element {
    const [joiningDefault, SetJoiningDefault] = useState<boolean>(false);
    const [joiningCustomized, SetJoiningCustomized] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDefault() {
        if (!joiningDefault) {
            try {
                await api({
                    url: CONFIG.REQUEST_TOURNAMENT,

                    method: CONFIG.REQUEST_TOURNAMENT_METHOD,
                    data: JSON.stringify({ name: 'champions_league', gameMode: 'classic' })
                });
            } catch (e: any) {
                console.error(e);
                setError(ERRORS.TOURNAMENT_CREATE_FAILED);
                return;
            }
        } else {
            try {
                await api({
                    url: CONFIG.REQUEST_TOURNAMENT_CANCEL('id'),

                    method: CONFIG.REQUEST_TOURNAMENT_METHOD
                });
            } catch (e: any) {
                console.error(e);
                setError(ERRORS.TOURNAMENT_CANCEL_FAILED);
                return;
            }
        }
        SetJoiningDefault(!joiningDefault);
    }
    async function handleCustomized() {
        if (!joiningCustomized) {
            try {
                await api({
                    url: CONFIG.REQUEST_TOURNAMENT,

                    method: CONFIG.REQUEST_TOURNAMENT_METHOD,
                    data: JSON.stringify({ name: 'olympics', gameMode: 'powerup' })
                });
            } catch (e: any) {
                console.error(e);
                setError(ERRORS.TOURNAMENT_CREATE_FAILED);
                return;
            }
        } else {
            try {
                await api({
                    url: CONFIG.REQUEST_TOURNAMENT_CANCEL('id'),

                    method: CONFIG.REQUEST_TOURNAMENT_METHOD
                });
            } catch (e: any) {
                console.error(e);
                setError(ERRORS.TOURNAMENT_CANCEL_FAILED);
                return;
            }
            SetJoiningCustomized(!joiningCustomized);
        }
    }


    return (
        <div className="min-h-full flex w-full">
            <div className="min-h-full flex w-1/2 justify-between border border-black">
                <div />
                <button onClick={handleDefault}>{joiningDefault ? CONFIG.CANCEL_JOIN_BUTTON : CONFIG.TOURNAMENT_CLASSIC_GAME}</button>
                <div />
            </div>
            <div className="min-h-full flex w-1/2 justify-between border border-black">
                <div />
                <button onClick={handleCustomized}>{joiningCustomized ? CONFIG.CANCEL_JOIN_BUTTON : CONFIG.TOURNAMENT_POWERUP_GAME}</button>
                <div />
            </div>
        </div>
    )
}

export function JoinSingleGames(): JSX.Element {
    const [joiningDefault, SetJoiningDefault] = useState<boolean>(false);
    const [joiningCustomized, SetJoiningCustomized] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDefault() {
        if (!joiningDefault) {
            try {
                await api({
                    url: CONFIG.REQUEST_MATCHMAKING_CLASSIC,

                    method: CONFIG.REQUEST_MATCHMAKING_METHOD
                });
            } catch (e: any) {
                console.error(e);
                setError(ERRORS.MATCHMAKING_CLASSIC_FAILED);
                return;
            }
        } else {
            try {
                await api({
                    url: CONFIG.REQUEST_MATCHMAKING_CLASSIC_CANCEL,

                    method: CONFIG.REQUEST_MATCHMAKING_METHOD
                });
            } catch (e: any) {
                console.error(e);
                setError(ERRORS.MATCHMAKING_LEAVE_FAILED);
                return;
            }
        }
        SetJoiningDefault(!joiningDefault);
    }
    async function handleCustomized() {
        if (!joiningCustomized) {
            try {
                await api({
                    url: CONFIG.REQUEST_MATCHMAKING_POWERUP,
                    method: CONFIG.REQUEST_MATCHMAKING_METHOD
                });
            } catch (e: any) {
                console.error(e);
                setError(ERRORS.MATCHMAKING_POWERUP_FAILED);
                return;
            }
        } else {
            try {
                await api({
                    url: CONFIG.REQUEST_MATCHMAKING_POWERUP_CANCEL,

                    method: CONFIG.REQUEST_MATCHMAKING_METHOD
                });
            } catch (e: any) {
                console.error(e);
                setError(ERRORS.MATCHMAKING_LEAVE_FAILED);
                return;

            }
            SetJoiningCustomized(!joiningCustomized);
        }
    }

    return (
        <div className="min-h-full w-full" id="SingleJoinGames">
            <div className="flex w-full min-h-full">
                <div className="min-h-full flex w-1/2 justify-between border border-black">
                    <div />
                    <button onClick={handleDefault}>{joiningDefault ? CONFIG.CANCEL_JOIN_BUTTON : CONFIG.SINGLE_CLASSIC_GAME}</button>
                    <div />
                </div>
                <div className="min-h-full flex w-1/2 justify-between border border-black">
                    <div />
                    <button onClick={handleCustomized}>{joiningCustomized ? CONFIG.CANCEL_JOIN_BUTTON : CONFIG.SINGLE_POWERUP_GAME}</button>
                    <div />
                </div>
            </div>
        </div>
    )
}

function MatchMakingError({ setState }: { setState: Dispatch<SetStateAction<string | null>> }): JSX.Element {

    return (
        <div>
            <div>{ERRORS.MATCHMAKING_JOIN_FAILED}</div>
            <button onClick={() => setState(null)}> reset</button>
        </div>
    )
}


function Lobby(): JSX.Element {
    const { rooms, error, isConnecting } = useLobbyRoom(
        () => client.joinOrCreate(CONFIG.LOBBYROOM),
    );

    if (isConnecting) return <p>Connecting...</p>;
    if (error) return <p>Error: {error.message}</p>;
    console.log(rooms);

    return (
        <ul>
            {rooms.map((room) => (
                <li key={room.roomId}>
                    {room.name} — {room.clients}/{room.maxClients} players | {room.roomId} roomId
                </li>
            ))}
        </ul>
    );
}
/* v8 ignore stop */
