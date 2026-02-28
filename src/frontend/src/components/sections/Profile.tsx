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
        <div id='avatar' className="flex min-w-full min-h-full bg-emerald-500/50 text-center">
            <div className="w-1/2 min-h-full flex flex-col justify-around text-xl">
                <div>
                    <div>{username}</div>
                    <div className=" flex justify-center">
                        {/*TODO: Change with actual profile pic of user*/}
                        <img src="./snake_codec.png" alt="profile_pic" className="w-1/4 min-h-1/2" />
                    </div>
                </div>
                <div></div>
            </div>
            <div id='profileProperties' className="w-1/2 min-h-full flex flex-col text-xl">

                <div className="flex justify-around min-h-1/2">
                    <div />
                    <div className="text-left w-3/5 flex flex-col justify-between">
                        <div />
                        <div className="flex flex-col justify-around min-h-3/5">
                            <ProfileProperty title="Username" property={username} dropDown={DropDown()} />
                            <ProfileProperty title="Email" property={email} dropDown={DropDown()} />
                            <div>Change password</div>
                            <div>Delete user</div>
                        </div>
                        <div />
                    </div>
                    <div />
                </div>
                <div className="flex min-h-1/2">
                    <div className="w-4/10">statistics</div>
                    <div className="w-2/10" />
                    <div className='w-4/10'>friends list</div>
                </div>

            </div>
        </div>
    )

}

function DropDown(): JSX.Element {
    return (
        <div>lol</div>
    );
}


function ProfileProperty({ title, property, dropDown }: { title: string, property: string | undefined, dropDown: JSX.Element }): JSX.Element {
    const [showDropdown, setShowDropDown] = useState<boolean>(false);

    function handleChange() {
        setShowDropDown(!showDropdown);
    }

    return (
        <div>
            <div className="flex ">
                <div className="w-1/5">{title}</div>
                <div className="w-1/10">•</div>
                <div className="w-2/5 text-left">{property}</div>
                <div className="w-1/10">•</div>
                <div className="w-1/5">
                    <button onClick={handleChange}>Change</button></div>
            </div>
            {showDropdown && dropDown}
        </div>
    )
}
/* v8 ignore stop*/
