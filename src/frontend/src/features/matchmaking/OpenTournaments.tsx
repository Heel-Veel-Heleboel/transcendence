import { useNavigate } from "react-router-dom";
import { JSX, useState } from "react";
import { Timer } from "./Timer";
import { ITournament } from "../../shared/types/matchmaking";
import useUserId from "../../components/hooks/useUserid";

function JoinTournament({ tournament, state }: { tournament: ITournament, state: string | undefined }): JSX.Element {
    const [isJoining, setIsJoining] = useState<boolean>(false);
    const {userId} = useUserId();

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

    return (
        <div>
            {userId === String(tournament.createdBy) ? <div>registered</div> : state && state === 'free' ?
                <button onClick={() => { register(String(tournament.id)) }}>join</button> : null
            }
        </div>

    )
}

function OpenTournaments({ state }: {  state: string | undefined }): JSX.Element {
    const navigate = useNavigate();

    // TODO: get tournaments
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
