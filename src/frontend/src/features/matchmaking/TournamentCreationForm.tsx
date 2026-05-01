import { useNavigate } from "react-router-dom";
import { HOME_NAVIGATION } from "../../shared/constants/navigation";
import { useMatchMakingService } from "../../components/providers/Match";
import { extractApiError } from "../../shared/utils/error";

export function TournamentCreationForm({ mode }: { mode: string }) {
    const navigate = useNavigate()
    const service = useMatchMakingService();

    async function submit(form: FormData) {
        const gameMode = form.get('game-mode-radio') as string;
        const name = form.get('tournament-name') as string;


        if (gameMode === null) {
            alert('non-valid game mode')
            return;
        }
        if (name === null) {
            alert('non-valid tournament name')
            return;
        }

        try {
            await service.setTournament({ name, gameMode })
            alert(`tournament: ${name} created`)
            navigate(HOME_NAVIGATION);
        } catch (e: any) {
            alert(`Failed to create tournament: ${extractApiError(e)}`);
        }
    };
    return (
        <div id="tournament-creation-form" className="flex flex-col">
            <div className="flex flex-col justify-around min-h-full">
                <form action={submit}>
                    <div className="flex flex-col">
                        GAME MODE:
                        <label htmlFor="game-mode-radio">
                            <input
                                type="radio"
                                name="game-mode-radio"
                                value="classic"
                                defaultChecked={mode === 'classic' ? true : false}
                            />
                            Classic
                        </label>
                        <label htmlFor="game-mode-radio">
                            <input
                                type="radio"
                                name="game-mode-radio"
                                value="powerup"
                                defaultChecked={mode === 'powerup' ? true : false}
                            />
                            Powerup
                        </label>
                        <br />
                        TOURNAMENT NAME:
                        <label htmlFor="tournament-name">
                            <input type="text" name="tournament-name" className="border" />
                        </label>
                        <br />
                        <button type="submit" className="border w-full" >CREATE</button>
                    </div>
                </form>
                <div id='space-container' />
            </div >
            <button onClick={() => navigate(HOME_NAVIGATION)} className="m-10">GO BACK TO HOME</button>

        </div >
    )
}
