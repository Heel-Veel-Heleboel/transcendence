import { JSX, useEffect, useState } from "react"
import { NavigateFunction, useNavigate } from "react-router-dom";
import { LobbyRoom } from "./LobbyRoom";
import api from "../../shared/api/api";
import { CONFIG } from "../../shared/config/AppConfig";
import { useNotifications } from "../../components/hooks/Notifications";
import { getCookie } from "../../shared/utils/cookies";
import { IMatchmakingStatus, ITournament } from "../../shared/types/matchmaking";
import { GameModeMenu } from "./GameModeMenu";


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


    // INFO: Moved to GameModeMenu
    // useEffect(() => {
    //     async function getTournament() {
    //         try {
    //             if (status === null) {
    //                 return;
    //             }
    //             const result = await api({
    //                 url: CONFIG.REQUEST_TOURNAMENT_INFO(String(status?.activeTournamentId)),
    //             })
    //             setActivityName(result.data.tournament.name);
    //         } catch (e: any) {
    //             console.error(e);
    //         }
    //     }
    //     async function getMatch() {
    //         try {
    //             if (status === null) {
    //                 return;
    //             }
    //             const result = await api({
    //                 url: CONFIG.REQUEST_MATCH_INFO(status.activeMatchId),
    //             })
    //             const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
    //             if (String(result.data.player1Id) === user_id) {
    //                 setActivityName(result.data.player2Username);
    //             } else if (String(result.data.player2Id) === user_id) {
    //                 setActivityName(result.data.player1Username);
    //             }
    //             console.log('getmatch')
    //             console.log(result);
    //         } catch (e: any) {
    //             console.error(e);
    //         }
    //     }
    //
    //
    //     if (status === null) {
    //         return;
    //     } else if (status.activeMatchId && !status.activeTournamentId) {
    //         getMatch();
    //
    //     } else if (!status.activeMatchId && status.activeTournamentId) {
    //         getTournament()
    //     }
    //
    // }, [status])

    // INFO: moved to OpenTournaments.tsx
    // useEffect(() => {
    //     async function getTournaments() {
    //         try {
    //             const result = await api({
    //                 url: CONFIG.REQUEST_TOURNAMENTS
    //             });
    //             setTournaments(result.data.tournaments);
    //         } catch (e: any) {
    //             console.error(e);
    //         }
    //     }
    //
    //     getTournaments()
    // }, [notif.tournamentUpdate])

    return (
        <div id='matchmaking-container' className="min-h-full w-full">
            <div className="h-1/4 w-full">
                <GameModeMenu state={status} />
            </div>
            <div id='games-panel' className="w-full min-h-3/4 flex">
                <div className="min-h-full w-1/2">
                    <LobbyRoom title="Current Games" >
                        <CurrentGames />
                    </LobbyRoom >
                </div>
                <div className="min-h-full w-1/2">
                    <LobbyRoom title="Open Tournaments"  >
                        <OpenTournaments tournaments={tournaments} state={status?.state} />
                    </LobbyRoom>
                </div>
            </div>
        </div >
    )
}

/* v8 ignore stop */
