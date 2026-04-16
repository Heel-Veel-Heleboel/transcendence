import { JSX } from "react";
import { useNavigate } from "react-router-dom";
import { CONFIG } from "../../shared/config/AppConfig";
import { FallbackProps, getErrorMessage } from "react-error-boundary";
import { closeCodes } from "../../shared/types/close-codes";

export function GameFallback({ error }: FallbackProps): JSX.Element {
    const navigate = useNavigate();
    const message = getErrorMessage(error) ?? "-1"

    let header = "something went wrong";
    let content = "something pretty bad";

    switch (Number(message)) {
        case 0:
            header = 'Game failed to initialize'
            content = 'Game has been cancelled and will not count towards your stats'
            break;
        case 1:
            header = 'Game crashed'
            content = 'Game has crashed, current score will be used to determine winner'
            break;

        case closeCodes.FAILED_TO_FINISH:
            header = 'Game result failed process'
            content = 'Game result was not able to be processed and will not count towards stats'
            break;

        case closeCodes.FAILED_TO_RECONNECT:
            header = 'other opponent disconnected'
            content = 'due to opponent disconnection you automatically win the match'
            break;

        case closeCodes.SERVER_ERROR:
            header = 'Game canceled due to server error'
            content = 'an error on the server caused the game to be cancelled, it will not count towards your stats'
            break;

        default:
            break;
    }



    return (
        <div className="flex flex-col min-h-full justify-between">
            <div />
            <div className="flex w-full justify-between">
                <div />
                <div className='text-center' role="alert">
                    <p >Oops! {header} </p>
                    <br />
                    <p >{content}</p>
                    <br />
                    <button onClick={() => { navigate(CONFIG.MENU_NAVIGATION) }}>Go back to Main Menu</button>
                </div>
                <div />
            </div>
            <div />
        </div>
    );
}
