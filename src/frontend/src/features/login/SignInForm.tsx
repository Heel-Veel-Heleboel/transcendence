import { JSX } from "react"
import { ErrorBoundary } from "react-error-boundary";
import { GeneralErrorFallback } from "../errors/GeneralErrorFallBack.tsx";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/providers/Auth.tsx";
import { CONFIG } from "../../shared/config/AppConfig.ts";
import { LOGIN_NAVIGATION } from "../../shared/constants/navigation.ts";

/* v8 ignore start */

export function SignInForm(): JSX.Element {
    const auth = useAuth();
    const navigate = useNavigate();
    async function submit(form: FormData) {
        const email = form.get("email");
        const username = form.get("username");
        const password = form.get("password");

        if (email === null) {
            throw Error('non-valid email')
        }
        if (username === null) {
            throw Error('non-valid username')
        }
        if (password === null) {
            throw Error('non-valid password')
        }

        try {
            await auth.logIn({ email, username, password });
        } catch (e: any) {
            throw e;
        }
        navigate(CONFIG.MENU_NAVIGATION);
    };
    return (
        <ErrorBoundary FallbackComponent={GeneralErrorFallback}>
            <div id="sign-in-form">
                <form action={submit}>
                    <label htmlFor="email">email</label><br />
                    <input type="text" name="email" className="border" /> <br />
                    <label htmlFor="username">username</label><br />
                    <input type="text" name="username" className="border" /> <br />
                    <label htmlFor="password">password</label><br />
                    <input type="text" name="password" className="border" /> <br /><br />
                    <button type="submit" className="border w-1/4" > SIGN IN</button>
                </form>
                <button onClick={() => navigate(LOGIN_NAVIGATION)} className="m-10">GO BACK</button>
            </div>
        </ErrorBoundary>
    )
}

/* v8 ignore stop */
