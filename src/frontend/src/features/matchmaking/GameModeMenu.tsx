import { useNavigate } from "react-router-dom";
import { IMatchmakingStatus, MatchmakingStatus } from "../../shared/types/matchmaking";
import { CurrentActivity } from "./Activity";
import { useMatchMakingService } from "../../components/providers/Match";
import { TOURNAMENT_CREATION_NAVIGATION, TOURNAMENT_CREATION_PAGE } from "../../shared/constants/navigation";

export function GameModeMenuButton({ callback, title }: { callback: () => void, title: string }) {
    return (
        <div className="min-h-full flex w-1/4 justify-between border border-black">
            <div />
            <button onClick={callback}>{title}</button>
            <div />
        </div >
    )
}

export function GameModeMenu({ status }: { status: IMatchmakingStatus }) {

    if (status.state !== MatchmakingStatus.FREE) {
        return (
            <CurrentActivity status={status} />
        )
    }

    return (
        <div id='game-mode-menu' className="min-h-full flex w-full">
            <div className="min-h-full flex w-full">
                <JoinClassicSingle />
                <JoinPowerupSingle />
                <CreateClassicTournament />
                <CreatePowerupTournament />
            </div>
        </div >
    )
}

export function JoinClassicSingle() {
    const service = useMatchMakingService();

    async function join() {
        try {
            await service.joinClassic();
        } catch (e: any) {
            console.error(e);
            alert('failed to join classic game pool')
        }
    }

    return (
        <GameModeMenuButton callback={join} title={'join classic 1v1'} />
    )
}

export function JoinPowerupSingle() {
    const service = useMatchMakingService();

    async function join() {
        try {
            await service.joinPowerup()
        } catch (e: any) {
            console.error(e);
            alert('failed to join powerup pool')
        }
    }

    return (
        <GameModeMenuButton callback={join} title={'join powerup 1v1'} />
    )
}

export function CreateClassicTournament() {
    const navigate = useNavigate();

    return (
        <GameModeMenuButton callback={() => { navigate(TOURNAMENT_CREATION_NAVIGATION, { state: { mode: 'classic' } }) }} title={'create classic tournament'} />
    )
}

export function CreatePowerupTournament() {
    const navigate = useNavigate();

    return (
        <GameModeMenuButton callback={() => { navigate(TOURNAMENT_CREATION_NAVIGATION, { state: { mode: 'powerup' } }) }} title={'create powerup tournament'} />
    )
}
