import { useState } from "react";
import { useAuth } from "../../components/providers/Auth";

export function TwoFactor() {
    const auth = useAuth();
    const [showDropdown, setShowDropDown] = useState<boolean>(false);
    const [qr, setQr] = useState<string>('');

    function handleDropDown() {
        setShowDropDown(!showDropdown);
    }

    async function request() {
        try {
            const result = await auth.setTwoFactor();
            setQr(result.data.qr_code);
        } catch (error) {
            console.error(error);
            alert("setting up 2fa failed");
        }
    }

    async function submit(form: FormData) {
        const token = form.get("token") as string;
        try {
            await auth.verifyTwoFactor(token);
            alert('verification success');
            window.location.reload();
        } catch (e: any) {
            alert('verification failed');
            console.error(e);
        }
    };

    return (
        <div id={'Two-Factor Authentication'.toLowerCase().replace(' ', '-')}>
            <div className="flex flex-col">
                <div className="w-full">
                    <button onClick={handleDropDown} className="hover:underline">{'Two-Factor Authentication'}</button>
                </div>
            </div>
            {
                showDropdown &&
                <div className="w-full border flex py-2">
                    <div className="w-2/5">
                        <span>Two-Factor Authenticator App</span>
                    </div>
                    <div className="flex w-3/5">
                        <button className="border w-1/2 hover:bg-white/10" onClick={request}>setup</button>
                    </div>
                </div>
            }
            {qr &&
                <div id="qr-code-verify">
                    <img id='2fa-qr-code' src={qr} alt="qrcode" className="w-1/2 h-1/2" />
                    <div id="qr-code-form">
                        <form action={submit}>
                            <label htmlFor="token">token</label><br />
                            <input type="text" name="token" className="border" /> <br />
                            <button type="submit" className="border w-1/4" >verify qr-code</button>
                        </form>
                    </div>
                </div>
            }
        </div>
    )
}


