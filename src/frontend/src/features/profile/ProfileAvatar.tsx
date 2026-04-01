import { BaseSyntheticEvent, Dispatch, ReactNode, SetStateAction, useEffect, useState } from "react";
import { useUserService } from "../../components/providers/User";
import useAxios from "axios-hooks";
import { IProfile } from "../../shared/types/profile";
import { DEFAULT_AVATAR, DEFAULT_PROFILE } from "../../shared/constants/defaults";

export function ProfileAvatar() {
    const userService = useUserService();
    const [profileResult] = userService.getProfile();
    const [profile, setProfile] = useState<IProfile>(DEFAULT_PROFILE);

    useEffect(() => {
        if (profileResult.data) {
            setProfile(profileResult.data)
        }
    }, [profileResult.data])

    if (profileResult.loading) {
        <ProfileAvatarContainer>
            <div>loading</div>
        </ProfileAvatarContainer>
    }

    if (profileResult.error) {
        return (
            <ProfileAvatarContainer>
                <div>error</div>
            </ProfileAvatarContainer>
        )
    }

    return (
        <ProfileAvatarContainer>
            <ProfileName name={profile.user.name} />
            <ProfilePicture profile={profile} />
        </ProfileAvatarContainer>
    )
}

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

export function ProfilePicture({ profile }: { profile: IProfile }) {
    const [image, setImage] = useState<string>(DEFAULT_AVATAR);
    const userService = useUserService();
    const [avatarResult] = userService.getProfileAvatar(profile.avatar_url);

    useEffect(() => {
        if (avatarResult.data) {
            const imageObjectUrl = URL.createObjectURL(avatarResult.data);
            setImage(imageObjectUrl);
        }
    }, [avatarResult])

    if (avatarResult.loading) {
        return (
            <ProfilePictureContainer>
                <div>loading</div>
            </ProfilePictureContainer>
        )
    }

    if (avatarResult.error) {
        console.error(avatarResult.error);
    }

    return (
        <ProfilePictureContainer>
            <div className="flex justify-between">
                <div />
                <img src={image} alt="profile_pic" className="w-1/4 min-h-1/2" />
                <div />
            </div>
            <ProfilePictureForm setImage={setImage} />
        </ProfilePictureContainer>
    )
}

export function ProfilePictureContainer({ children }: { children: ReactNode }) {
    return (
        <div id='profile-picture' className="flex justify-center">
            <div className="flex flex-col">
                {children}
            </div>
        </div>
    )

}

export function ProfilePictureForm({ setImage }: { setImage: Dispatch<SetStateAction<string>> }) {
    const userService = useUserService();
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

    async function uploadFiles(formData: FormData) {
        try {
            await userService.postProfileAvatar({ data: formData },);
            if (selectedFiles) {
                const imageObjectUrl = URL.createObjectURL(selectedFiles[0]);
                setImage(imageObjectUrl);
            }
            alert("Files uploaded!");
        } catch (error) {
            console.error("Error uploading files:", error);
            alert("Upload failed.");
        }
    };

    async function handleFileChange(event: BaseSyntheticEvent) {
        setSelectedFiles(event.target.files);
    };

    async function handleSubmit(event: BaseSyntheticEvent) {
        event.preventDefault();

        if (!selectedFiles) {
            alert("Please select files first!");
            return;
        }

        const formData = new FormData();
        formData.append("images", selectedFiles[0]);

        await uploadFiles(formData);
    };


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
