import { JSX, useState } from "react"
import { START_MENU_PAGE, LOGIN_OPTION } from '../constants/Constants.ts'
import { CONFIG } from "../constants/AppConfig.ts";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "./ErrorFallBack.tsx";
import { MenuOption } from './StartMenuUtils.tsx'

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
            <MenuOption text="BACK TO MENU" margin={0} callback={() => redirect(START_MENU_PAGE.MENU)} />
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
        // TODO: delete when refresh_token is implemented as http-only from auth server
        function createCookie(name: string, value: string, days: number) {
            let expires;
            if (days) {
                let date = new Date();
                date.setDate(date.getDate() + days);
                expires = "; expires=" + date;
            }
            else {
                expires = "";
            }
            document.cookie = name + "=" + value + expires + "; path=/";
        }
        try {
            const response = await fetch(CONFIG.REQUEST_SIGNIN, {
                method: CONFIG.REQUEST_SIGNIN_METHOD,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: email, username: username, password: password }),

            });
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            const result = await response.json();
            console.log(result);
            // TODO: delete when refresh_token is implemented as http-only from auth server
            createCookie("refresh_token", result.refresh_token, 7);
        } catch (error: any) {
            console.error(error.message);
        }

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
            const response = await fetch(CONFIG.REQUEST_REGISTER, {
                method: CONFIG.REQUEST_REGISTER_METHOD,
                headers: CONFIG.REQUEST_REGISTER_HEADERS,
                body: JSON.stringify({ email: email, user_name: username, password: password }),

            });
            if (!response.ok) {
                throw new Error(`${response.status}`);
            }

            const result = await response.json();
            console.log(result);
            callback(LOGIN_OPTION.REGISTER_SUCCESFULL);

        } catch (error: any) {
            if (error.message === '500') {
                throw new Error("credentials are already used");
            }
            throw new Error(`unknown error with status code: ${error.message}`)
        }
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
