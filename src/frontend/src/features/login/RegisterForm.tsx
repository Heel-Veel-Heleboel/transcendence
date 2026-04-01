import { JSX, useState } from "react"
import { ErrorBoundary } from "react-error-boundary";
import { GeneralErrorFallback } from "../errors/GeneralErrorFallBack.tsx";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/providers/Auth.tsx";
import { LOGIN_NAVIGATION, SIGNIN_NAVIGATION } from "../../shared/constants/navigation.ts";

export function RegisterForm(): JSX.Element {
    const auth = useAuth();
    const navigate = useNavigate();
    const [registered, setRegisterd] = useState<boolean>(false);

    async function submit(form: FormData) {
        const email = form.get("email");
        const username = form.get("username");
        const password = form.get("password");

        if (username === null) {
            throw Error('non-valid user-name')
        }
        if (password === null) {
            throw Error('non-valid password')
        }

        try {
            await auth.register({ email, username, password });
        } catch (e: any) {
            throw e;
        }
        setRegisterd(true);

    };
    return (

        <ErrorBoundary FallbackComponent={GeneralErrorFallback}>
            {!registered ?
                <div id="register-form">
                    <form action={submit}>
                        <label htmlFor="email">email</label><br />
                        <input type="text" name="email" className="border" /> <br />
                        <label htmlFor="username">username</label><br />
                        <input type="text" name="username" className="border" /> <br />
                        <label htmlFor="password">password</label><br />
                        <input type="text" name="password" className="border" /> <br /><br />
                        <button type="submit" className="border w-1/4" >REGISTER</button>
                    </form>
                    <button onClick={() => navigate(LOGIN_NAVIGATION)} className="m-10">GO BACK</button>
                </div> :
                <RegisterSuccesfull callback={() => navigate(SIGNIN_NAVIGATION)} />
            }
        </ErrorBoundary>
    )
}


export function RegisterSuccesfull({ callback }: { callback: () => void }): JSX.Element {
    return (
        <div id='register-succesfull'>
            <div className="text-3xl text-green-400">Registration succesfull</div>
            <button onClick={() => callback()} className="m-10">GO TO LOGIN</button>
        </div>
    )
}
