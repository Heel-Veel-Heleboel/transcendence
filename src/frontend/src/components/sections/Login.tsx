import { JSX, useState } from "react"
import { START_MENU_PAGE, LOGIN_OPTION } from '../../constants/Constants.ts'
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "../errors/ErrorFallBack.tsx";
import { MenuOption } from '../utils/StartMenuUtils.tsx'
import { useAuth } from "../providers/Auth.tsx";
import { useNavigate } from "react-router-dom";
import { CONFIG } from "../../constants/AppConfig.ts";

/* v8 ignore start */
export function Login({ redirect }: { redirect: (page: number) => void }): JSX.Element {
    const [loginOption, setLoginOption] = useState<number>(LOGIN_OPTION.DEFAULT_LOGIN);

    let component;
    switch (loginOption) {
        case LOGIN_OPTION.DEFAULT_LOGIN:
            component = <DefaultLogin callback={setLoginOption} />
            break;
        case LOGIN_OPTION.SIGN_IN:
            component = <SignInForm callback={setLoginOption} />
            break;
        case LOGIN_OPTION.REGISTER:
            component = <RegisterForm callback={setLoginOption} />
            break;
        case LOGIN_OPTION.REGISTER_SUCCESFULL:
            component = <RegisterSuccesfull callback={setLoginOption} />
            break;
        default:
            component = <DefaultLogin callback={setLoginOption} />
    }
    return (
        <div className="min-h-full text-white text-center flex flex-col justify-around bg-zinc-400/60 border font-orbi">
            {component}
            <MenuOption text={CONFIG.LOGIN_MENU_RETURN_TEXT} margin={0} callback={() => redirect(START_MENU_PAGE.MENU)} />
        </div>
    )
}

export function DefaultLogin({ callback }: { callback: (page: number) => void }): JSX.Element {
    return (

        <div className="text-3xl">
            <button onClick={() => callback(LOGIN_OPTION.SIGN_IN)} className="border w-3xs">SIGN IN</button>
            <br />
            <br />
            <button onClick={() => callback(LOGIN_OPTION.REGISTER)} className="border w-3xs">REGISTER</button>
        </div>
    )
}

export function SignInForm({ callback }: { callback: (page: number) => void }): JSX.Element {
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
        navigate(CONFIG.MENU_NAVIGATTION);
    };
    return (
        <div>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
                <form action={submit}>
                    <label htmlFor="email">email</label><br />
                    <input type="text" name="email" className="border" /> <br />
                    <label htmlFor="username">username</label><br />
                    <input type="text" name="username" className="border" /> <br />
                    <label htmlFor="password">password</label><br />
                    <input type="text" name="password" className="border" /> <br /><br />
                    <button type="submit" className="border w-1/4" > SIGN IN</button>
                </form>
                <button onClick={() => callback(LOGIN_OPTION.DEFAULT_LOGIN)} className="m-10">GO BACK</button>
            </ErrorBoundary>
        </div>
    )
}

export function RegisterForm({ callback }: { callback: (page: number) => void }): JSX.Element {
    const auth = useAuth();

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
        callback(LOGIN_OPTION.REGISTER_SUCCESFULL);

    };
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <form action={submit}>
                <label htmlFor="email">email</label><br />
                <input type="text" name="email" className="border" /> <br />
                <label htmlFor="username">username</label><br />
                <input type="text" name="username" className="border" /> <br />
                <label htmlFor="password">password</label><br />
                <input type="text" name="password" className="border" /> <br /><br />
                <button type="submit" className="border w-1/4" >REGISTER</button>
            </form>
            <button onClick={() => callback(LOGIN_OPTION.DEFAULT_LOGIN)} className="m-10">GO BACK</button>
        </ErrorBoundary>
    )
}


export function RegisterSuccesfull({ callback }: { callback: (page: number) => void }): JSX.Element {
    return (
        <div>
            <div className="text-3xl text-green-400">Registration succesfull</div>
            <button onClick={() => callback(LOGIN_OPTION.SIGN_IN)} className="m-10">GO TO LOGIN</button>
        </div>
    )
}
/* v8 ignore stop */
