import { Dispatch, JSX, SetStateAction, useEffect, useState } from "react"
import { LobbyRoom } from "../utils/MenuUtils"

import { Client } from "@colyseus/sdk";
import { useLobbyRoom } from "@colyseus/react";
import api from "../../api";
import { CONFIG } from "../../constants/AppConfig";
import { ERRORS } from "../../constants/Errors";

const client = new Client("ws://localhost:2567");


/* v8 ignore start */
export function Matchmaking(): JSX.Element {
    return (
        <div id={CONFIG.MATCHMAKING_CONTAINER_ID} className="h-9/10 flex flex-col">
            <div className="min-h-1/4 flex">
                <JoinSingleGames />
                <JoinTournamentGames />
            </div>
            <div id='GamesPanel' className="w-full min-h-3/4 flex">
                <div className="min-h-full w-1/2">
                    <LobbyRoom title="Current Games" gamesContent={CurrentGames()} />
                </div>
                <div className="min-h-full w-1/2">
                    <LobbyRoom title="Open Tournaments" gamesContent={OpenTournaments()} />
                </div>
            </div>
        </div>
    );
}

export interface ITournamentStatus {
    canCreate: boolean
    canJoin: boolean
    hasCreatedTournament: boolean
    isInActiveTournament: boolean

}


export function JoinTournamentGames(): JSX.Element {
    const [tournament, setTournament] = useState<ITournamentStatus | null>(null);
    const [isConnecting, setIsConnecting] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    async function handleDefault() {
        try {
            await api({
                url: CONFIG.REQUEST_TOURNAMENT,

                method: CONFIG.REQUEST_TOURNAMENT_METHOD,
                headers: CONFIG.REQUEST_TOURNAMENT_HEADERS,
                data: JSON.stringify({ name: 'champions_league', gameMode: 'classic' })
            });
        } catch (e: any) {
            console.error(e);
            setError(ERRORS.TOURNAMENT_CREATE_FAILED);
            return;
        }
    }
    async function handleCustomized() {
        try {
            await api({
                url: CONFIG.REQUEST_TOURNAMENT,
                method: CONFIG.REQUEST_TOURNAMENT_METHOD,
                headers: CONFIG.REQUEST_TOURNAMENT_HEADERS,
                data: JSON.stringify({ name: 'olympics', gameMode: 'powerup' })
            });
        } catch (e: any) {
            console.error(e);
            setError(ERRORS.TOURNAMENT_CREATE_FAILED);
            return;
        }
    }

    useEffect(() => {
        async function getTournament() {
            try {
                const result = await api({
                    url: CONFIG.REQUEST_TOURNAMENT_STATUS,
                })
                console.log('tournament');
                console.log(result);
                setTournament(result.data)
                setIsConnecting(false);
            } catch (e: any) {
                console.error(e);
                setError(e);
            }
        }

        getTournament();
    }, [])

    if (isConnecting) return <p>Connecting...</p>;
    if (error) return <p>Error: {error}</p>;


    return (
        <div className="min-h-full flex w-full">
            <div className="min-h-full flex w-1/2 justify-between border border-black">
                <div />
                <button onClick={handleDefault}>{CONFIG.TOURNAMENT_CLASSIC_GAME}</button>
                <div />
            </div>
            <div className="min-h-full flex w-1/2 justify-between border border-black">
                <div />
                <button onClick={handleCustomized}>{CONFIG.TOURNAMENT_POWERUP_GAME}</button>
                <div />
            </div>
        </div>
    )
}

export function JoinSingleGames(): JSX.Element {
    const [joiningDefault, SetJoiningDefault] = useState<boolean>(false);
    const [joiningCustomized, SetJoiningCustomized] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
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

    if (isConnecting) return <p>Connecting...</p>;
    if (error) return <p>Error: {error}</p>;

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


function CurrentGames(): JSX.Element {
    const { rooms, error, isConnecting } = useLobbyRoom(
        () => client.joinOrCreate(CONFIG.LOBBYROOM),
    );

    if (isConnecting) return <p>Connecting...</p>;
    if (error) return <p>Error: {error.message}</p>;

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

export interface ITournament {
    createdAt: string
    createdBy: number
    gameMode: string
    id: number
    maxPlayers: number
    minPlayers: number
    name: string
    participantCount: number
    registrationEnd: string
    startTime: string | null
    status: string
}

function OpenTournaments(): JSX.Element {
    const [tournaments, setTournaments] = useState<Array<ITournament>>([]);
    const [isConnecting, setIsConnecting] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function getTournaments() {
            try {
                const result = await api({
                    url: CONFIG.REQUEST_TOURNAMENT
                });
                setTournaments(result.data.tournaments);
                setIsConnecting(false);
            } catch (e: any) {
                console.error(e);
                setError(e);
            }
        }

        getTournaments()
    }, [])

    if (isConnecting) return <p>Connecting...</p>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <ul>
            {tournaments.map((tournament) => (
                <li key={tournament.id}>
                    {tournament.name}
                </li>
            ))}
        </ul>
    );
}
/* v8 ignore stop */
