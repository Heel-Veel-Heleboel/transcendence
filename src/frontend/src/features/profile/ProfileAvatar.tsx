import { BaseSyntheticEvent, ReactNode } from "react";

export function ProfileAvatarContainer({ children }: { children: ReactNode }) {
    return (
        <div id="profile-avatar" className="w-1/2 min-h-full flex flex-col justify-around text-xl">
            <div className="h-3/5">
                <div className="min-h-full flex flex-col justify-between">
                    {children}
                </div>
            </div>
        </div>
    )
}

export function ProfileName({ name }: { name: string }) {
    return (
        <div id="profile-name">
            {name}
        </div>
    )
}

export function ProfilePicture({ image }: { image: string }) {
    return (
        <div id='profile-picture' className="flex justify-center">
            {<img src={image} alt="profile_pic" className="w-1/4 min-h-1/2" />}
        </div>
    )
}

export function ProfilePictureForm({ handleSubmit, handleFileChange }: { handleSubmit: (event: BaseSyntheticEvent) => void, handleFileChange: (event: BaseSyntheticEvent) => void }) {
    return (
        <div id='profile-picture-form' className="flex justify-between">
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
