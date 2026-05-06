import { BaseSyntheticEvent, Dispatch, SetStateAction, useEffect, useState } from "react";
import { useUserService } from "../../components/providers/User";
import { IProfile } from "../../shared/types/profile";
import { DEFAULT_AVATAR, DEFAULT_PROFILE } from "../../shared/constants/defaults";
import { useAuth } from "../../components/providers/Auth";
import { ProfilePictureImage } from "./ProfilePictureImage";
import { ProfilePictureContainer } from "./ProfilePictureContainer";
import { ProfileAvatarContainer } from "./ProfileAvatarContainer";
import { ProfileName } from "./ProfileName";
import { CONFIG } from "../../shared/config/AppConfig";
import { extractApiError } from "../../shared/utils/error";

export function ProfileAvatar() {
    const userService = useUserService();
    const auth = useAuth();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [profile, setProfile] = useState<IProfile>(DEFAULT_PROFILE);

    useEffect(() => {
        async function getProfile() {
            try {
                const result = await userService.getProfile(auth.userId);
                setProfile(result.data);
            } catch (e: any) {
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        getProfile();
    }, [])

    if (loading) {
        return (
            <ProfileAvatarContainer>
                <div>loading</div>
            </ProfileAvatarContainer>
        )
    }

    if (error) {
        return (
            <ProfileAvatarContainer>
                <div>error</div>
            </ProfileAvatarContainer>
        )
    }

    return (
        <ProfileAvatarContainer>
            <ProfilePicture profile={profile} />
        </ProfileAvatarContainer>
    )
}


export function ProfilePicture({ profile }: { profile: IProfile }) {
    const [image, setImage] = useState<string>(DEFAULT_AVATAR);
    const userService = useUserService();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        async function getProfileAvatar() {
            try {
                if (profile.avatar_url === null) {
                    throw new Error('no avatar');
                }
                const result = await userService.getProfileAvatar(profile.avatar_url);
                const imageObjectUrl = URL.createObjectURL(result.data);
                setImage(imageObjectUrl);
            } catch (e: any) {
                console.error(e);
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        getProfileAvatar();
    }, [])

    if (loading) {
        return (
            <ProfilePictureContainer>
                <div>loading</div>
            </ProfilePictureContainer>
        )
    }

    if (error) {
    }

    return (
        <ProfilePictureContainer>
            <ProfileName name={profile.user.name} />
            <ProfilePictureImage image={image} />
            <ProfilePictureForm setImage={setImage} />
        </ProfilePictureContainer>
    )
}



export function ProfilePictureForm({ setImage }: { setImage: Dispatch<SetStateAction<string>> }) {
    const userService = useUserService();
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

    const maxMB = Math.round(CONFIG.UPLOAD_MAX_BYTES / (1024 * 1024));
    const hint = `Accepted: ${CONFIG.UPLOAD_ALLOWED_LABEL} · Max ${maxMB} MB`;

    async function uploadFiles(formData: FormData) {
        try {
            await userService.setProfileAvatar(formData);
            if (selectedFiles) {
                const imageObjectUrl = URL.createObjectURL(selectedFiles[0]);
                setImage(imageObjectUrl);
            }
            alert("Profile picture updated!");
        } catch (error) {
            console.error("Error uploading files:", error);
            alert(extractApiError(error));
        }
    };

    async function handleFileChange(event: BaseSyntheticEvent) {
        setSelectedFiles(event.target.files);
    };

    async function handleSubmit(event: BaseSyntheticEvent) {
        event.preventDefault();

        if (!selectedFiles || selectedFiles.length === 0) {
            alert("Please select a file first.");
            return;
        }

        const file = selectedFiles[0];

        if (!CONFIG.UPLOAD_ALLOWED_TYPES.includes(file.type as any)) {
            alert(`Invalid file type "${file.type}". Allowed formats: ${CONFIG.UPLOAD_ALLOWED_LABEL}.`);
            return;
        }

        if (file.size > CONFIG.UPLOAD_MAX_BYTES) {
            alert(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is ${maxMB} MB.`);
            return;
        }

        const formData = new FormData();
        formData.append("images", file);

        await uploadFiles(formData);
    };


    return (
        <div id='profile-picture-form' className="flex justify-between min-h-1/4">
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
                                accept={CONFIG.UPLOAD_ALLOWED_TYPES.join(',')}
                                onChange={handleFileChange}

                            />
                            <button className="text-sm border" type="submit">Upload Image</button>
                        </div>
                        <div className="text-left text-xs text-gray-400 mt-1">{hint}</div>
                    </div>

                </form>
            </div>
            <div />
        </div>
    )
}
