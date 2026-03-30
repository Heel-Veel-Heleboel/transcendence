import { BaseSyntheticEvent, useEffect, useState } from "react";
import { useUserService } from "../../components/providers/User";
import useAxios from "axios-hooks";
import { IProfile } from "../../shared/types/profile";
import { DEFAULT_AVATAR } from "../../shared/constants/Constants";

export function ProfileAvatarContainer() {
    const userService = useUserService();
    const [profileResult] = useAxios(userService.getProfile());
    const [imageResult, executeImage] = useAxios(userService.getProfile());
    const [profile, setProfile] = useState<IProfile | null>(null);
    const [name, setName] = useState<string>('mysterio');
    const [image, setImage] = useState<string>(DEFAULT_AVATAR);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

    useEffect(() => {
        if (profileResult.data) {
            setProfile(profileResult.data)
            setName(profileResult.data.name)
        }
    }, [profileResult.data])

    async function uploadFiles(formData: FormData) {
        try {
            await api.post(CONFIG.REQUEST_PROFILE_PICTURE_UPLOAD + profile?.user_id, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
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


    useEffect(() => {
        async function getPicture() {
            try {
                if (profile?.avatar_url === null) {
                    setImage(DEFAULT_AVATAR);
                    return;
                }
                const result = await api({
                    url: CONFIG.REQUEST_PROFILE_PICTURE + profile?.avatar_url,
                    responseType: 'blob'
                })
                const imageObjectUrl = URL.createObjectURL(result.data);
                setImage(imageObjectUrl);
            }
            catch (e: any) {
                console.error(e);
                throw new Error('getPicture failed');
            }
        }

        if (profile) {
            getPicture()
        }
    }, [profile])
    return (
        <div id="profile-avatar" className="w-1/2 min-h-full flex flex-col justify-around text-xl">
            <div className="h-3/5">
                <div className="min-h-full flex flex-col justify-between">
                    <ProfileName name={name} />
                    <ProfilePicture image={image} />
                    <ProfilePictureForm handleSubmit={handleSubmit} handleFileChange={handleFileChange} />
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
