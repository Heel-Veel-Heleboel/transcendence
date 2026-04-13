import { JSX, useEffect, useState } from "react";
import { IMatchmakingStatus } from "../../shared/types/matchmaking";
import { useNavigate } from "react-router-dom";
import { useMatchMakingService } from "../../components/providers/Match";
import { useAuth } from "../../components/providers/Auth";
import { TOURNAMENT_NAVIGATION_REDIRECT } from "../../shared/constants/navigation";

export function CurrentActivity({ status }: { status: IMatchmakingStatus }) {

    if (status.activeMatchId) {
        return (
            <PendingMatch status={status} />
        )
    }
    else if (status.state === 'in_pool' && !status.activeMatchId) {
        return (
            <InPool status={status} />
        )
    } else if (status.activeTournamentId) {
        return (
            <TournamentActivity status={status} />
        )
    } else {
        return (
            <div id="current-activity-error">error</div>
        )
    }
}

export function TournamentActivity({ status }: { status: IMatchmakingStatus }) {
    const service = useMatchMakingService();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [tournamentName, setTournamentName] = useState<string>('');

    useEffect(() => {
        async function getActiveTournament() {
            try {
                setLoading(true);
                setError(false);
                const result = await service.getTournamentInfo(String(status.activeTournamentId));
                console.log('here');
                console.log(result);
                console.log(status);
                setTournamentName(result.data.tournament.name);
            } catch (e: any) {
                console.error(e);
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        getActiveTournament();
    }, [])

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

    if (status.state === 'in_tournament_active' && status.activeTournamentId) {
        return (
            <ActiveTournament tournamentId={String(status.activeTournamentId)} tournamentName={tournamentName} />
        )
    } else if (status.state === 'in_tournament_registration') {
        return (
            <PendingTournament status={status} tournamentId={String(status.activeTournamentId)} tournamentName={tournamentName} />
        )
    }
}


export function PendingTournament({ status, tournamentId, tournamentName }: { status: IMatchmakingStatus, tournamentId: string, tournamentName: string }) {
    const navigate = useNavigate();
    const service = useMatchMakingService();
    const [callbackTitle, setCallbackTitle] = useState<string>('');

    async function cancelTournament() {
        try {
            await service.cancelTournament(String(status.activeTournamentId));
        } catch (e: any) {
            console.error(e);
            alert('failed to cancel tournament')
        }
    }

    async function unregisterTournament() {
        try {
            await service.unregisterTournament(String(status.activeTournamentId));
        } catch (e: any) {
            console.error(e);
            alert('failed to leave tournament')
        }
    }


    useEffect(() => {
        console.log(tournamentName);
        if (status.activeTournamentId && status.isCreator) {
            setCallbackTitle('cancel');
        }
        else if (status.activeTournamentId && !status.isCreator) {
            setCallbackTitle('leave');
        }
    }, [])
    if (status.state === 'in_tournament_registration' && status.activeTournamentId && status.isCreator)
        return (
            <Activity
                label={<div>Pending tournament: <button onClick={() => { navigate(TOURNAMENT_NAVIGATION_REDIRECT(tournamentId)) }}>{tournamentName} </button></div>}
                callback={callbackTitle === 'cancel' ? () => { cancelTournament() } : callbackTitle === 'leave' ? () => { unregisterTournament() } : () => { return }}
                callbackTitle={callbackTitle}
            />
        )
}

export function ActiveTournament({ tournamentId, tournamentName }: { tournamentId: string, tournamentName: string }) {
    const navigate = useNavigate();

    return (
        <Activity label={<div>Current tournament: <button onClick={() => { navigate(TOURNAMENT_NAVIGATION_REDIRECT(tournamentId)) }}>{tournamentName} </button></div>} callback={null} callbackTitle={''} />
    )
}

export function PendingMatch({ status }: { status: IMatchmakingStatus }) {
    const auth = useAuth();
    const service = useMatchMakingService();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [opponent, setOpponent] = useState<string>('mysterio');

    useEffect(() => {
        async function getMatch() {
            try {
                if (status.activeMatchId) {
                    const result = await service.getMatchInfo(status.activeMatchId);
                    const match = result.data;
                    const name = String(match.player1Id) === auth.userId ? match.player2Username : match.player1Username;
                    setOpponent(name);
                }
            } catch (e: any) {
                console.error(e);
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        getMatch();
    }, [])

    if (loading) {
        return (
            <div>loading</div>
        )
    }

    if (error) {
        return (
            <div id="pending-match-error">error</div>
        )
    }

    return (
        <Activity label={<div>{`Current match vs ${opponent}`}</div>} callback={null} callbackTitle={''} />
    )

}

export function InPool({ status }: { status: IMatchmakingStatus }) {
    const service = useMatchMakingService();
    const gameMode = status.poolGameMode;
    const callback = gameMode === 'classic' ? service.leaveClassic : gameMode === 'powerup' ? service.leavePowerup : () => { return };

    return (
        <Activity label={<div>`in {status.poolGameMode} match pool`</div>} callback={() => { callback() }} callbackTitle={'leave'} />
    );

}

export function Activity({ label, callback, callbackTitle }: { label: JSX.Element, callback: (() => void) | null, callbackTitle: string }) {
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


