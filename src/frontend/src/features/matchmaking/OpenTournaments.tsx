import { useNavigate } from "react-router-dom";
import { JSX, useEffect, useState } from "react";
import { Timer } from "./Timer";
import { ITournament } from "../../shared/types/matchmaking";
import useUserId from "../../components/hooks/useUserid";
import { useMatchMakingService } from "../../components/providers/Match";
import { useNotifications } from "../../components/hooks/Notifications";
import { TOURNAMENT_NAVIGATION_REDIRECT } from "../../shared/constants/navigation";

function JoinTournament({ tournament, state }: { tournament: ITournament, state: string }): JSX.Element {
    const { userId } = useUserId();
    const service = useMatchMakingService();

    async function register(id: string) {
        try {
            await service.registerTournament(id);
            alert(`joined tournament: ${tournament.name}!`)
        } catch (e: any) {
            console.error(e);
            alert('failed to join tournament')
        }
    }

    return (
        <div>
            {userId === String(tournament.createdBy) ? <div>registered</div> : state && state === 'free' ?
                <button onClick={() => { register(String(tournament.id)) }}>join</button> : null
            }
        </div>

    )
}

export function OpenTournaments({ state }: { state: string }): JSX.Element {
    const navigate = useNavigate();
    const notif = useNotifications();
    const service = useMatchMakingService();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [tournaments, setTournaments] = useState<Array<ITournament>>([]);

    useEffect(() => {
        async function getTournaments() {
            try {
                setError(false);
                setLoading(true);
                const result = await service.getTournaments();
                setTournaments(result.data.tournaments);
            } catch (e: any) {
                setError(true);
            }
            finally {
                setLoading(false)
            }
        }

        getTournaments();
    }, [notif.tournamentUpdate])

    if (loading) {
        return (
            <div>loading</div>
        )
    }

    if (error) {
        return (
            <div>error</div>
        )
    }

    return (
        <ul>
            {tournaments.map((tournament) => (
                <li key={tournament.id}>
                    <div className="flex justify-around">
                        <button onClick={() => { navigate(TOURNAMENT_NAVIGATION_REDIRECT(String(tournament.id))) }}>{tournament.name} </button>
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
