import { JSX, useState } from "react"
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/providers/Auth.tsx";
import { ENTRY_NAVIGATION, LOGIN_NAVIGATION } from "../../shared/constants/navigation.ts";
import { extractApiError } from "../../shared/utils/error.ts";

function validateFields(email: string, user_name: string, password: string): string {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return 'Please enter a valid email address.';
    if (!user_name)
        return 'Username is required.';
    if (user_name.length < 3 || user_name.length > 20)
        return 'Username must be between 3 and 20 characters.';
    if (!/^[a-zA-Z0-9_]+$/.test(user_name))
        return 'Username may only contain letters, numbers, and underscores.';
    if (!password)
        return 'Password is required.';
    if (password.length < 8)
        return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password))
        return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(password))
        return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(password))
        return 'Password must contain at least one number.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
        return 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>).';
    if (/\s/.test(password))
        return 'Password must not contain spaces.';
    return '';
}

export function RegisterForm(): JSX.Element {
    const auth = useAuth();
    const navigate = useNavigate();
    const [registered, setRegistered] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    async function submit(form: FormData) {
        setErrorMessage('');
        const email = form.get("email") as string;
        const user_name = form.get("username") as string;
        const password = form.get("password") as string;

        const validationError = validateFields(email, user_name, password);
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        try {
            await auth.register({ email, user_name, password });
            setRegistered(true);
        } catch (e: any) {
            setErrorMessage(extractApiError(e));
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
                        <input type="password" name="password" className="border" /> <br />
                        <small className="text-gray-400">
                            Min 8 chars · uppercase · lowercase · number · special char (!@#$%^&amp;*(),.?&quot;:&#123;&#125;|&lt;&gt;)
                        </small>
                        <br /><br />
                        {errorMessage && (
                            <p className="text-red-400 mb-2">{errorMessage}</p>
                        )}
                        <button type="submit" className="border w-1/4">REGISTER</button>
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
