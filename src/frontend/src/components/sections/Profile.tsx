import { JSX } from "react"

/* v8 ignore start */
export function Profile(): JSX.Element {
    return (
        <div className="flex min-w-full min-h-full bg-emerald-500/50 text-center">
            <div className="w-1/2 flex flex-col justify-around text-xl">
                <div>
                    <div>user-name</div>
                    <div>alias</div>
                    <div className=" flex justify-center">
                        {/*TODO: Change with actual profile pic of user*/}
                        <img src="./snake_codec.png" alt="profile_pic" className="w-1/4 h-1/2" />
                    </div>
                </div>
                <div></div>
            </div>
            <div className="w-1/2 flex flex-col justify-around text-xl">
                <div>
                    <div>user-name</div>
                    <div>alias</div>
                    <div>password</div>
                    <div>email address</div>
                </div>
                <div></div>
            </div>
        </div>
    )

}
/* v8 ignore stop*/
