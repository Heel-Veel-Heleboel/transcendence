import { JSX, useEffect, useState } from "react"
import { LobbyRoom } from "../utils/MenuUtils"

import { Client } from "@colyseus/sdk";
import { useLobbyRoom } from "@colyseus/react";
import api from "../../api";
import { CONFIG } from "../../constants/AppConfig";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/Notifications";
import * as timer from 'react-timer-hook';
import { getCookie } from "../utils/cookies";
import { IMatchmakingStatus, ITournament } from "../../types/matchmaking";

const client = new Client("ws://localhost:2567");


/* v8 ignore start */
export function Matchmaking(): JSX.Element {
    const [status, setStatus] = useState<IMatchmakingStatus | null>(null);
    const [tournaments, setTournaments] = useState<Array<ITournament>>([]);
    const [activityName, setActivityName] = useState<string>('');
    const notif = useNotifications();
    const navigate = useNavigate();

    useEffect(() => {
        async function getStatus() {
            try {
                const result = await api({
                    url: CONFIG.REQUEST_MATCHMAKING_STATUS
                })
                setStatus(result.data);
            } catch (e: any) {
                console.error(e);
            }
        }
        setActivityName('');
        getStatus()
    }, [notif.tournamentUpdate, notif.matchUpdate]);

    useEffect(() => {
        async function getTournament() {
            try {
                if (status === null) {
                    return;
                }
                const result = await api({
                    url: CONFIG.REQUEST_TOURNAMENT_INFO(status?.activeTournamentId),
                })
                setActivityName(result.data.tournament.name);
            } catch (e: any) {
                console.error(e);
            }
        }
        async function getMatch() {
            try {
                if (status === null) {
                    return;
                }
                const result = await api({
                    url: CONFIG.REQUEST_MATCH_INFO(status.activeMatchId),
                })
                const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
                if (String(result.data.player1Id) === user_id) {
                    setActivityName(result.data.player2Username);
                } else if (String(result.data.player2Id) === user_id) {
                    setActivityName(result.data.player1Username);
                }
                console.log('getmatch')
                console.log(result);
            } catch (e: any) {
                console.error(e);
            }
        }


        if (status === null) {
            return;
        } else if (status.activeMatchId && !status.activeTournamentId) {
            getMatch();

        } else if (!status.activeMatchId && status.activeTournamentId) {
            getTournament()
        }

    }, [status])

    useEffect(() => {
        async function getTournaments() {
            try {
                const result = await api({
                    url: CONFIG.REQUEST_TOURNAMENTS
                });
                setTournaments(result.data.tournaments);
            } catch (e: any) {
                console.error(e);
            }
        }

        getTournaments()
    }, [notif.tournamentUpdate])

    return (
        <div id='MatchmakingContainer' className="min-h-full w-full">
            <div className="h-1/4 w-full">
                {status && status?.state !== 'free' ? CurrentActivity(status, activityName, navigate) : GameModeMenu()}
            </div>
            <div id='GamesPanel' className="w-full min-h-3/4 flex">
                <div className="min-h-full w-1/2">
                    <LobbyRoom title="Current Games" gamesContent={CurrentGames()} />
                </div>
                <div className="min-h-full w-1/2">
                    <LobbyRoom title="Open Tournaments" gamesContent={OpenTournaments(tournaments, status?.state)} />
                </div>
            </div>
        </div>
    )
}

export function CurrentActivity(status: IMatchmakingStatus | null, name: string, navigate: NavigateFunction) {
    if (status === null) {
        throw new Error('currentActivity fail');
    }

    async function handleTournamentCancel(tournamentId: string) {
        try {
            await api({
                url: CONFIG.REQUEST_TOURNAMENT_CANCEL(tournamentId),
                method: CONFIG.REQUEST_TOURNAMENT_METHOD
            })
        } catch (e: any) {
            console.error(e);
        }
    }

    async function handleTournamentLeave(tournamentId: string) {
        try {
            await api({
                url: CONFIG.REQUEST_TOURNAMENT_UNREGISTER(tournamentId),
                method: CONFIG.REQUEST_TOURNAMENT_METHOD
            })
        } catch (e: any) {
            console.error(e);
        }
    }

    async function handleSingleClassicLeave() {
        try {
            await api({
                url: CONFIG.REQUEST_MATCHMAKING_CLASSIC_CANCEL,

                method: CONFIG.REQUEST_MATCHMAKING_METHOD
            });
        } catch (e: any) {
            console.error(e);
            return;
        }
    }
    async function handleSinglePowerupLeave() {
        try {
            await api({
                url: CONFIG.REQUEST_MATCHMAKING_POWERUP_CANCEL,

                method: CONFIG.REQUEST_MATCHMAKING_METHOD
            });
        } catch (e: any) {
            console.error(e);
            return;
        }
    }

    if (status.state === 'in_tournament_active' && status.activeTournamentId)
        return Activity(<div>Current tournament: <button onClick={() => { navigate(CONFIG.TOURNAMENT_NAVIGATION_REDIRECT(String(status.activeTournamentId))) }}>{name} </button></div>, null, null);
    else if (status.state === 'in_tournament_registration' && status.activeTournamentId && status.isCreator)
        return Activity(<div>Pending tournament: <button onClick={() => { navigate(CONFIG.TOURNAMENT_NAVIGATION_REDIRECT(String(status.activeTournamentId))) }}>{name} </button></div>, () => handleTournamentCancel(String(status.activeTournamentId)), 'cancel');
    else if (status.state === 'in_tournament_registration' && status.activeTournamentId && !status.isCreator)
        return Activity(<div>Pending tournament: <button onClick={() => { navigate(CONFIG.TOURNAMENT_NAVIGATION_REDIRECT(String(status.activeTournamentId))) }}>{name} </button></div>, () => handleTournamentLeave(String(status.activeTournamentId)), 'leave');
    else if (status.state === 'match_pending_ack' && status.activeMatchId)
        return Activity(<div>`Current match vs ${name}`</div>, null, null);
    else if (status.state === 'in_pool' && !status.activeMatchId) {
        if (status.poolGameMode === 'classic') {
            return Activity(<div>`in classic match pool`</div>, () => handleSingleClassicLeave(), 'leave');
        } else if (status.poolGameMode === 'powerup') {
            return Activity(<div>`in powerup match pool`</div>, () => handleSinglePowerupLeave(), 'leave');
        }
    }
    else
        throw new Error('currentActivity fail');
}


export function Activity(label: JSX.Element, callback: (() => void) | null, callbackTitle: string | null) {
    return (
        <div className="min-h-full w-full flex flex-col justify-between">
            <div />
            <div className="flex justify-between">
                <div />
                {label}
                {callback ? <button onClick={callback}>{callbackTitle}</button> : null}
                <div />
            </div>
            <div />
        </div>
    )

}

export function GameModeMenuButton({ callback, title }: { callback: () => void, title: string }) {
    return (
        <div className="min-h-full flex w-1/4 justify-between border border-black">
            <div />
            <button onClick={callback}>{title}</button>
            <div />
        </div >
    )
}

export function GameModeMenu() {
    async function createClassicTournament() {
        try {
            await api({
                url: CONFIG.REQUEST_TOURNAMENT_CREATION,

                method: CONFIG.REQUEST_TOURNAMENT_METHOD,
                headers: CONFIG.REQUEST_TOURNAMENT_HEADERS,
                data: JSON.stringify({ name: 'champions_league', gameMode: 'classic' })
            });
        } catch (e: any) {
            console.error(e);
            return;
        }
    }
    async function createPowerUpTournament() {
        try {
            await api({
                url: CONFIG.REQUEST_TOURNAMENT_CREATION,
                method: CONFIG.REQUEST_TOURNAMENT_METHOD,
                headers: CONFIG.REQUEST_TOURNAMENT_HEADERS,
                data: JSON.stringify({ name: 'olympics', gameMode: 'powerup' })
            });
        } catch (e: any) {
            console.error(e);
            return;
        }
    }

    async function joinClassicSingle() {
        try {
            await api({
                url: CONFIG.REQUEST_MATCHMAKING_CLASSIC,

                method: CONFIG.REQUEST_MATCHMAKING_METHOD
            });
        } catch (e: any) {
            console.error(e);
        }
    }
    async function joinPowerupSingle() {
        try {
            await api({
                url: CONFIG.REQUEST_MATCHMAKING_POWERUP,
                method: CONFIG.REQUEST_MATCHMAKING_METHOD
            });
        } catch (e: any) {
            console.error(e);
        }
    }


    return (
        <div className="min-h-full flex w-full">
            <div className="min-h-full flex w-full">
                <GameModeMenuButton callback={joinClassicSingle} title={CONFIG.SINGLE_CLASSIC_GAME} />
                <GameModeMenuButton callback={joinPowerupSingle} title={CONFIG.SINGLE_POWERUP_GAME} />
                <GameModeMenuButton callback={createClassicTournament} title={CONFIG.TOURNAMENT_CLASSIC_GAME} />
                <GameModeMenuButton callback={createPowerUpTournament} title={CONFIG.TOURNAMENT_POWERUP_GAME} />
            </div>
        </div >
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


function Timer({ expiryTimestamp }: { expiryTimestamp: Date }): JSX.Element {
    const {
        seconds,
        minutes,
    } = timer.useTimer({ expiryTimestamp, onExpire: () => console.warn('onExpire called') });

    return (
        <div >
            {minutes}:{seconds}
        </div>
    )

}

function JoinTournament({ tournament, state }: { tournament: ITournament, state: string | undefined }): JSX.Element {
    const [isJoining, setIsJoining] = useState<boolean>(false);
    const [userId, setUserId] = useState<string>('');

    async function register(id: string) {
        try {
            await api({
                url: CONFIG.REQUEST_TOURNAMENT_REGISTER(id),
                method: CONFIG.REQUEST_TOURNAMENT_METHOD,
            })
            setIsJoining(true);
        } catch (e: any) {
            console.error(e);
        }

    }

    useEffect(() => {
        const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
        setUserId(user_id);
    }, [])

    return (
        <div>
            {userId === String(tournament.createdBy) ? <div>registered</div> : state && state === 'free' ?
                <button onClick={() => { register(String(tournament.id)) }}>join</button> : null
            }
        </div>

    )
}

function OpenTournaments(tournaments: Array<ITournament>, state: string | undefined): JSX.Element {
    const navigate = useNavigate();

    return (
        <ul>
            {tournaments.map((tournament) => (
                <li key={tournament.id}>
                    <div className="flex justify-around">
                        <button onClick={() => { navigate(CONFIG.TOURNAMENT_NAVIGATION_REDIRECT(String(tournament.id))) }}>{tournament.name} </button>
                        <div className="flex justify-around">
                            <div>| {tournament.participantCount}  |</div>
                            <Timer expiryTimestamp={new Date(tournament.registrationEnd)} />
                            <div>| {' '}</div>
                        </div>
                        <JoinTournament tournament={tournament} state={state} />
                    </div>
                </li>
            ))}
        </ul>
    );
}
/* v8 ignore stop */
