import { JSX, useEffect, useState } from "react";
import api from "../shared/api/api";
import { CONFIG } from "../shared/config/AppConfig";
import { MainContainer } from "../components/layout/MainContainer";
import { useParams } from "react-router-dom";
import { ITournament } from "../shared/types/matchmaking";
import { Terminal } from "../components/layout/Terminal";

export function Tournament(): JSX.Element {
    const { tournamentId } = useParams()
    const [tournament, setTournament] = useState<ITournament | null>(null);
    const [rankings, setRankings] = useState<null>(null);
    const [matches, setMatches] = useState<null>(null);
    const [participants, setParticipants] = useState<null>(null);
    const [isConnecting, setIsConnecting] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    if (tournamentId === undefined) {
        throw new Error('no param');
    }

    useEffect(() => {
        async function getTournament() {
            try {
                if (tournamentId) {
                    const result = await api({
                        url: CONFIG.REQUEST_TOURNAMENT_INFO(tournamentId)
                    })
                    setTournament(result.data.tournament);
                    setIsConnecting(false);
                }
            } catch (e: any) {
                console.error(e);
            }
        }
        async function getRankings() {
            try {
                if (tournamentId) {
                    const result = await api({
                        url: CONFIG.REQUEST_TOURNAMENT_RANKING(tournamentId)
                    })
                    console.log('rankings');
                    setIsConnecting(false);
                }
            } catch (e: any) {
                console.error(e);
            }
        }
        async function getMatches() {
            try {
                if (tournamentId) {
                    const result = await api({
                        url: CONFIG.REQUEST_TOURNAMENT_MATCHES(tournamentId)
                    })
                    console.log('matches');
                    setIsConnecting(false);
                }
            } catch (e: any) {
                console.error(e);
            }
        }
        async function getParticipants() {
            try {
                if (tournamentId) {
                    const result = await api({
                        url: CONFIG.REQUEST_TOURNAMENT_PARTICIPANTS(tournamentId)
                    })
                    console.log('participants')
                    console.log(result);
                    setIsConnecting(false);
                }
            } catch (e: any) {
                console.error(e);
            }
        }
        getTournament();
        getRankings();
        getMatches();
        getParticipants();
    }, [])

    if (isConnecting) return <p>Connecting...</p>;
    if (error) return <p>Error</p>;

    return (
        < MainContainer children={<TournamentContent tournament={tournament} />} />
    )
}

export function TournamentContent({ tournament }: { tournament: ITournament | null }): JSX.Element {
    if (tournament === null) {
        return <div></div>
    }
    return (

        <div className="w-full min-h-full flex flex-col">
            <div className="h-1/2 flex justify-around">
                <div className="flex flex-col justify-between">
                    <div></div>
                    <div>name</div>
                    <div>mode</div>
                    <div>status</div>
                    <div></div>
                </div>
                <div className="flex flex-col">
                    <div className="h-1/10"></div>
                    <div className="h-8/10">
                        <Terminal title="participants" >
                            <div> content</div>
                        </Terminal >
                    </div>
                    <div className="h-1/10"></div>
                </div>
                <div className="flex flex-col">
                    <div className="h-1/10"></div>
                    <div className="h-8/10">
                        <Terminal title="participants" >
                            child={<div> content</div>}
                        </Terminal >
                    </div>
                    <div className="h-1/10"></div>
                </div>
            </div>
            <div className="h-1/2">bracket rendering</div>

        </div>

    )
}



