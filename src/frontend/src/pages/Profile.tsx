import { BaseSyntheticEvent, JSX, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/providers/Auth";
import { ProfileContainer } from "../features/profile/ProfileContainer";
import { ProfileAvatarContainer, ProfileName, ProfilePicture, ProfilePictureForm } from "../features/profile/ProfileAvatar";
import { ProfileProperties, ProfilePropertiesPrimary, ProfilePropertiesSecundary } from "../features/profile/ProfileProperties";
import { Username } from "../features/profile/Username";
import { Email } from "../features/profile/Email";
import { Password } from "../features/profile/Password";
import { DeleteAccount } from "../features/profile/DeleteAccount";
import { ProfileRelationships } from "../features/profile/ProfileRelationships";
import api from "../shared/api/api";
import { CONFIG } from "../shared/config/AppConfig";
import { getCookie } from "../shared/utils/cookies";
import { ERRORS } from "../shared/errors/Errors";
import { MainContainer } from "../components/layout/MainContainer";
import { Widget } from "../components/layout/Widget";
import { IProfile, IUser } from "../shared/types/profile";
import { useApi } from "../components/hooks/Api";
import { useUserService } from "../components/providers/User";
import useAxios from "axios-hooks";

/* v8 ignore start */


export function Profile(): JSX.Element {
    const auth = useAuth();
    const navigate = useNavigate();

    if (!auth.token) {
        navigate('/');
    }

    return (
        <MainContainer children={
            <Widget logoPath={CONFIG.PROFILE_LOGO} title={CONFIG.PROFILE_TITLE} width="w-full" >
                <UserProfileContent />
            </Widget>
        } />
    )
}

export function UserProfileContent(): JSX.Element {
    const userService = useUserService();
    const [userResult] = useAxios(userService.getUser());
    const [profileResult] = useAxios(userService.getProfile());
    const [profile, setProfile] = useState<IProfile | null>(null);
    const [user, setUser] = useState<IUser | null>(null);
    const [name, setName] = useState<string>('mysterio');
    const [email, setEmail] = useState<string>('mysterio@myster.io');
    const [image, setImage] = useState<string>(CONFIG.PROFILE_DEFAULT_LOGO);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

    useEffect(() => {
        if (userResult.data) {
            setName(userResult.data.name)
            setEmail(userResult.data.email)
        }
    }, [userResult.data])

    async function uploadFiles(formData: FormData) {
        try {
            await api.post(CONFIG.REQUEST_PROFILE_PICTURE_UPLOAD + user?.id, formData, {
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
                    setImage(CONFIG.PROFILE_DEFAULT_LOGO);
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
        <ProfileContainer >
            <ProfileAvatarContainer >
                <ProfileName name={name} />
                <ProfilePicture image={image} />
                <ProfilePictureForm handleSubmit={handleSubmit} handleFileChange={handleFileChange} />
            </ProfileAvatarContainer >
            <ProfileProperties>
                <ProfilePropertiesPrimary>
                    <ProfileRelationships />
                    <Username userResult={userResult} />
                    <Email email={email} />
                    <Password />
                    <DeleteAccount />
                </ProfilePropertiesPrimary>
                <ProfilePropertiesSecundary>
                    <div className="w-1/20"></div>
                    <div className="w-8/10">statistics</div>
                    <div className="w-1/20"></div>
                </ProfilePropertiesSecundary>
            </ProfileProperties>
        </ProfileContainer >
    )
}

/* v8 ignore stop*/
