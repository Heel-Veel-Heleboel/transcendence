import { JSX } from "react";
import { CONFIG } from "../../shared/config/AppConfig";

export function Logo(): JSX.Element {
    return (
        <div id="login-logo" className="flex justify-center ml-auto mr-auto opacity-95 contrast-200">
            <img src={CONFIG.LOGIN_PAGE_LOGO} alt={CONFIG.LOGIN_PAGE_ALT} />
        </div>
    )
}
