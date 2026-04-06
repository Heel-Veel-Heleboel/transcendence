
import { JSX } from "react"
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/providers/Auth.tsx";
import { ENTRY_NAVIGATION, HOME_NAVIGATION } from "../../shared/constants/navigation.ts";

/* v8 ignore start */

export function TwoFactorForm({ email, password }: { email: string, password: string }): JSX.Element {
    const auth = useAuth();
    const navigate = useNavigate();

    async function submit(form: FormData) {
        const two_factor_token = form.get("two_factor_token") as string;
        try {
            await auth.logIn({ email, password, two_factor_token });
            navigate(HOME_NAVIGATION);
        } catch (e: any) {
            alert('two-factor verification failed')
            console.error(e);
        }
    };

    return (
        <div id="2fa-form">
            <form action={submit}>
                <label htmlFor="two_factor_token">token</label><br />
                <input type="text" name="two_factor_token" className="border" /> <br />
                <button type="submit" className="border w-1/4" >VERIFY</button>
            </form>
            <button onClick={() => navigate((ENTRY_NAVIGATION))} className="m-10">GO BACK</button>
        </div>
    )
}
