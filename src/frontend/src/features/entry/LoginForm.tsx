import { JSX } from "react"
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/providers/Auth.tsx";
import { CONFIG } from "../../shared/config/AppConfig.ts";
import { ENTRY_NAVIGATION } from "../../shared/constants/navigation.ts";

/* v8 ignore start */

export function LoginForm(): JSX.Element {
    const auth = useAuth();
    const navigate = useNavigate();
    async function submit(form: FormData) {
        const email = form.get("email") as string;
        const user_name = form.get("username") as string;
        const password = form.get("password") as string;

        if (email === null) {
            alert('non-valid email')
            return;
        }
        if (user_name === null) {
            alert('non-valid username')
            return;
        }
        if (password === null) {
            alert('non-valid password')
            return;
        }

        try {
            await auth.logIn({ email, password });
            navigate(CONFIG.MENU_NAVIGATION);
        } catch (e: any) {
            alert('log in failed')
            console.error(e);
        }
    };
    return (
        <div id="login-form">
            <form action={submit}>
                <label htmlFor="email">email</label><br />
                <input type="text" name="email" className="border" /> <br />
                <label htmlFor="username">username</label><br />
                <input type="text" name="username" className="border" /> <br />
                <label htmlFor="password">password</label><br />
                <input type="text" name="password" className="border" /> <br /><br />
                <button type="submit" className="border w-1/4" > LOG IN</button>
            </form>
            <button onClick={() => navigate(ENTRY_NAVIGATION)} className="m-10">GO BACK</button>
        </div>
    )
}

/* v8 ignore stop */
