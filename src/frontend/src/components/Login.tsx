import { JSX, useState } from "react"
import { START_MENU_PAGE, LOGIN_OPTION } from '../constants/Constants.ts'
import { MenuOption } from './StartMenuUtils.tsx'

/* v8 ignore start */
export function Login({ redirect }: { redirect: (page: number) => void }): JSX.Element {
    const [loginOption, setLoginOption] = useState<number>(LOGIN_OPTION.DEFAULT_LOGIN);
    let component;
    switch (loginOption) {
        case LOGIN_OPTION.DEFAULT_LOGIN:
            component = <DefaultLogin callback={setLoginOption} />
            break;
        case LOGIN_OPTION.SIGIN:
            component = <SignInForm callback={setLoginOption} />
            break;
        case LOGIN_OPTION.REGISTER:
            component = <RegisterForm callback={setLoginOption} />
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
            <button onClick={() => callback(LOGIN_OPTION.SIGIN)} className="border w-3xs">SIGN IN</button>
            <br />
            <br />
            <button onClick={() => callback(LOGIN_OPTION.REGISTER)} className="border w-3xs">REGISTER</button>
        </div>
    )
}

export function SignInForm({ callback }: { callback: (page: number) => void }): JSX.Element {
    // TODO: take data from form and send object to api-gateway:port/api/auth/login
    // TODO: check if login was succesful
    // TODO: auth service will return refresh token and acces token
    // TODO: check how to store tokens
    function submit(form: FormData) {
        const username = form.get("user-name");
        const password = form.get("password");
        console.log(form)
        console.log(username);
        console.log(password);
    };
    return (
        <div>
            <form action={submit}>
                <label htmlFor="user-name">user-name</label><br />
                <input type="text" name="user-name" className="border" /> <br />
                <label htmlFor="password">password</label><br />
                <input type="text" name="password" className="border" /> <br /><br />
                <button type="submit" className="border w-1/4" > SIGN IN</button>
            </form>
            <button onClick={() => callback(LOGIN_OPTION.DEFAULT_LOGIN)} className="m-10">GO BACK</button>
        </div>
    )
}

export function RegisterForm({ callback }: { callback: (page: number) => void }): JSX.Element {
    // TODO: take data from form and send object to api-gateway:port/api/auth/register
    // TODO: check if registration was succesful
    return (
        <div>
            <form action="">
                <label htmlFor="email address">email address</label><br />
                <input type="text" id="email address" className="border" /> <br />
                <label htmlFor="user-name">user-name</label><br />
                <input type="text" id="user-name" className="border" /> <br />
                <label htmlFor="password">password</label><br />
                <input type="text" id="password" className="border" /> <br /><br />
                <input type="submit" value="REGISTER" className="border w-1/4" />
            </form>
            <button onClick={() => callback(LOGIN_OPTION.DEFAULT_LOGIN)} className="m-10">GO BACK</button>
        </div>
    )
}
/* v8 ignore stop */
