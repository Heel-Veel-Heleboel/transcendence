import { JSX, useState } from "react"
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/providers/Auth.tsx";
import { ENTRY_NAVIGATION, HOME_NAVIGATION, TWO_FACTOR_NAVIGATION } from "../../shared/constants/navigation.ts";
import { extractApiError } from "../../shared/utils/error.ts";

/* v8 ignore start */

export function LoginForm(): JSX.Element {
    const auth = useAuth();
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState<string>('');

    async function submit(form: FormData) {
        setErrorMessage('');
        const email = form.get("email") as string;
        const password = form.get("password") as string;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErrorMessage('Please enter a valid email address.');
            return;
        }
        if (!password) {
            setErrorMessage('Password is required.');
            return;
        }

        try {
            await auth.logIn({ email, password });
            navigate(HOME_NAVIGATION);
        } catch (e: any) {
            if (e.response?.status === 420) {
                navigate(TWO_FACTOR_NAVIGATION, { state: { email, password } });
            } else {
                setErrorMessage(extractApiError(e));
            }
        }
    };

    return (
        <div id="login-form">
            <form action={submit}>
                <label htmlFor="email">email</label><br />
                <input type="text" name="email" className="border" /> <br />
                <label htmlFor="password">password</label><br />
                <input type="password" name="password" className="border" /> <br /><br />
                {errorMessage && (
                    <p className="text-red-400 mb-2">{errorMessage}</p>
                )}
                <button type="submit" className="border w-1/4">LOG IN</button>
            </form>
            <button onClick={() => navigate(ENTRY_NAVIGATION)} className="m-10">GO BACK</button>
        </div>
    )
}

/* v8 ignore stop */
