import { JSX, useEffect, useState } from "react";
import { MainContainer } from "../components/sections/MainContainer";
import { useParams } from "react-router-dom";
import api from "../api";
import { CONFIG } from "../constants/AppConfig";
import { ITournament } from "../components/widgets/Matchmaking";


export function Tournament(): JSX.Element {
    const { tournamentId } = useParams()
    const [tournament, setTournament] = useState<ITournament | null>(null);
    const [rankings, setRankings] = useState<null>(null);
    const [matches, setMatches] = useState<null>(null);
    const [participants, setParticipants] = useState<null>(null);
    const [isConnecting, setIsConnecting] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function getTournament() {
            try {
                const result = await api({
                    url: CONFIG.REQUEST_TOURNAMENT_INFO(Number(tournamentId))
                })
                setTournament(result.data.tournament);
                setIsConnecting(false);
            } catch (e: any) {
                console.error(e);
            }
        }
        getTournament();
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
        <div>{tournament.name} | {tournament.createdBy} | {tournament.participantCount}</div>
    )
}
