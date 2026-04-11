import { JSX, useEffect, useState } from "react"
import { LobbyRoom } from "./LobbyRoom";
import { useNotifications } from "../../components/hooks/Notifications";
import { IMatchmakingStatus } from "../../shared/types/matchmaking";
import { GameModeMenu } from "./GameModeMenu";
import { useMatchMakingService } from "../../components/providers/Match";
import { DEFAULT_MATCHSTATUS } from "../../shared/constants/defaults";
import { CurrentGames } from "./CurrentGames";
import { OpenTournaments } from "./OpenTournaments";


/* v8 ignore start */
export function Matchmaking(): JSX.Element {
    const notif = useNotifications();
    const service = useMatchMakingService();
    const [status, setStatus] = useState<IMatchmakingStatus>(DEFAULT_MATCHSTATUS);

    useEffect(() => {
        async function getStatus() {
            try {
                const result = await service.getStatus();
                setStatus(result.data);
            } catch (e: any) {
                console.error(e);
            }
        }

        getStatus()
    }, [notif.tournamentUpdate, notif.matchUpdate]);


    return (
        <div id='matchmaking-container' className="min-h-full w-full">
            <div className="h-1/4 w-full">
                <GameModeMenu status={status} />
            </div>
            <div id='games-panel' className="w-full min-h-3/4 flex">
                <div className="min-h-full w-1/2">
                    <LobbyRoom title="Current Games" >
                        <CurrentGames />
                    </LobbyRoom >
                </div>
                <div className="min-h-full w-1/2">
                    <LobbyRoom title="Open Tournaments"  >
                        <OpenTournaments state={status.state} />
                    </LobbyRoom>
                </div>
            </div>
        </div >
    )
}

/* v8 ignore stop */
