import { JSX, useState } from "react"
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/providers/Auth.tsx";
import { ENTRY_NAVIGATION, LOGIN_NAVIGATION } from "../../shared/constants/navigation.ts";

export function RegisterForm(): JSX.Element {
    const auth = useAuth();
    const navigate = useNavigate();
    const [registered, setRegistered] = useState<boolean>(false);

    async function submit(form: FormData) {
        const email = form.get("email") as string;
        const user_name = form.get("username") as string;
        const password = form.get("password") as string;

        if (user_name === null) {
            alert('non-valid user-name')
            return;
        }
        if (password === null) {
            alert('non-valid password')
            return;
        }

        try {
            await auth.register({ email, user_name, password });
            setRegistered(true);
        } catch (e: any) {
            alert('registration failed');
        }
    };
    return (
        <div id="registration-container">
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
                    <button onClick={() => navigate(ENTRY_NAVIGATION)} className="m-10">GO BACK</button>
                </div> :
                <RegisterSuccesfull callback={() => navigate(LOGIN_NAVIGATION)} />
            }
        </div>
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
