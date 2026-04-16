import { JSX } from "react";
import { useNavigate } from "react-router-dom";
import { CONFIG } from "../../shared/config/AppConfig";
import { FallbackProps, getErrorMessage } from "react-error-boundary";

export function GameCrash({ error }: FallbackProps): JSX.Element {
    const navigate = useNavigate();
    const message = getErrorMessage(error) ?? "Unknown Error"
    return (
        <div className="flex flex-col min-h-full justify-between">
            <div />
            <div className="flex w-full justify-between">
                <div />
                <div className='text-center' role="alert">
                    <p >Oops! {message} </p>
                    <br />
                    <p >the Game has been cancelled and won't count for your stats</p>
                    <br />
                    <button onClick={() => { navigate(CONFIG.MENU_NAVIGATION) }}>Go back to Main Menu</button>
                </div>
                <div />
            </div>
            <div />
        </div>
    );
}
