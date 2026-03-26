import { BaseSyntheticEvent, ReactNode } from "react";

export function ProfileAvatarContainer({ children }: { children: ReactNode }) {
    return (
        <div className="w-1/2 min-h-full flex flex-col justify-around text-xl">
            <div id="ProfileAvatarContainer" className="h-3/5">
                <div className="flex flex-col justify-between">
                    {children}
                </div>
            </div>
        </div>
    )
}

export function ProfilePicture({ username, image }: { username: string | undefined, image: string }) {
    return (
        <div>
            <div>{username}</div>
            <div id='profilePicture' className="flex justify-center">
                {<img src={image} alt="profile_pic" className="w-1/4 min-h-1/2" />}
            </div>
        </div>
    )
}

export function SubmitContainer({ handleSubmit, handleFileChange }: { handleSubmit: (event: BaseSyntheticEvent) => void, handleFileChange: (event: BaseSyntheticEvent) => void }) {
    return (
        <div id='SubmitPictureContainer' className="flex justify-between">
            <div />
            <div className="w-1/2">
                <form onSubmit={handleSubmit} >

                    <div >
                        <div className="text-left text-base">Change Profile Picture</div>
                        <div className="flex">
                            <input
                                className="border text-sm block w-full placeholder:text-body
                                           file:mr-5 file:py-4 file:px-2
                                           file:text-sm file:font-medium
                                           file:bg-gray-200 file:text-white-700"
                                id="file_input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}

                            />
                            <button className="text-sm border" type="submit">Upload Image</button>
                        </div>
                    </div>

                </form>
            </div>
            <div />
        </div>
    )
}
