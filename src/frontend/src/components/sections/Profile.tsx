import { JSX, useEffect, useState } from "react"
import api from "../../api";
import { CONFIG } from "../../constants/AppConfig";
import { IUserResponse } from "../../types/types";
import { getCookie } from "../../utils/cookies";
import { ERRORS } from "../../constants/Errors";

/* v8 ignore start */
export function Profile(): JSX.Element {
    const [username, setUsername] = useState<string>();
    const [email, setEmail] = useState<string>();

    useEffect(() => {
        async function getUser() {
            const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
            try {
                const user = await api<IUserResponse>({
                    url: CONFIG.REQUEST_USER + user_id
                })
                setUsername(user.data.name);
                setEmail(user.data.email);
            }
            catch (e: any) {
                console.error(e);
                throw new Error(ERRORS.PROFILE_USER_FAILED);
            }
        }

        getUser()
    }, [])

    return (
        <div className="flex min-w-full min-h-full bg-emerald-500/50 text-center">
            <div className="w-1/2 flex flex-col justify-around text-xl">
                <div>
                    <div>{username}</div>
                    <div className=" flex justify-center">
                        {/*TODO: Change with actual profile pic of user*/}
                        <img src="./snake_codec.png" alt="profile_pic" className="w-1/4 h-1/2" />
                    </div>
                </div>
                <div></div>
            </div>
            <div className="w-1/2 flex flex-col justify-around text-xl">
                <div>
                    <div>change user-name</div>
                    <div>{email}</div>
                    <div>change email address</div>
                    <div>change password</div>
                    <div>delete user</div>
                    <div>statistics</div>
                    <div>friends list</div>
                </div>
                <div></div>
            </div>
        </div>
    )

}
/* v8 ignore stop*/
