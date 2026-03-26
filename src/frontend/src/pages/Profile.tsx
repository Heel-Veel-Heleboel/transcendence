import { BaseSyntheticEvent, JSX, useEffect, useState } from "react"
import api from "../api";
import { CONFIG } from "../constants/AppConfig";
import { getCookie } from "../components/utils/cookies";
import { ERRORS } from "../constants/Errors";
import { MainContainer } from "../components/sections/MainContainer";
import { Widget } from "../components/utils/MenuUtils";
import { useNavigate } from "react-router-dom";
import { IProfile, IUser } from "../types/profile";
import { useAuth } from "../components/providers/Auth";
import { ProfileContainer } from "../features/profile/ProfileContainer";
import { ProfileAvatarContainer, ProfilePicture, SubmitContainer } from "../features/profile/ProfileAvatar";
import { ProfileProperties, ProfilePropertiesPrimary, ProfilePropertiesSecundary } from "../features/profile/ProfileProperties";
import { FriendshipList } from "../features/relationships/FriendshipList";
import { FriendshipRequests } from "../features/relationships/FriendshipRequests";
import { Username } from "../features/profile/Username";
import { Email } from "../features/profile/Email";
import { Password } from "../features/profile/Password";
import { DeleteAccount } from "../features/profile/DeleteAccount";

/* v8 ignore start */


export function Profile(): JSX.Element {
    const auth = useAuth();
    const navigate = useNavigate();

    if (!auth.token) {
        navigate('/');
    }

    return (
        <MainContainer children={
            <Widget logoPath={CONFIG.PROFILE_LOGO} title={CONFIG.PROFILE_TITLE} width="w-full" child={<UserProfileContent />} />
        } />
    )
}


export function UserProfileContent(): JSX.Element {
    const [profile, setProfile] = useState<IProfile | null>(null);
    const [user, setUser] = useState<IUser | null>(null);
    const [image, setImage] = useState<string>(CONFIG.PROFILE_DEFAULT_LOGO);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

    async function uploadFiles(formData: FormData) {
        try {
            const response = await api.post(CONFIG.REQUEST_PROFILE_PICTURE_UPLOAD + user?.id, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            console.log("Upload successful:", response.data);
            alert("Files uploaded!");
            for (const value of formData.values()) {
                console.log(value);
            }
            if (selectedFiles) {
                const imageObjectUrl = URL.createObjectURL(selectedFiles[0]);
                setImage(imageObjectUrl);
            }
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
        async function getUser() {
            const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
            try {
                const result = await api<IUser>({
                    url: CONFIG.REQUEST_USER + user_id
                })
                setUser(result.data);
            }
            catch (e: any) {
                console.error(e);
                throw new Error(ERRORS.PROFILE_USER_FAILED);
            }
        }
        async function getProfile() {
            const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
            try {
                const result = await api<IProfile>({
                    url: CONFIG.REQUEST_PROFILE + user_id
                })
                console.log('getprofile');
                console.log(result);
                setProfile(result.data);
            }
            catch (e: any) {
                console.error(e);
                throw new Error(ERRORS.PROFILE_USER_FAILED);
            }
        }

        getProfile()
        getUser();
    }, [])

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
                <ProfilePicture username={user?.name} image={image} />
                <SubmitContainer handleSubmit={handleSubmit} handleFileChange={handleFileChange} />
            </ProfileAvatarContainer >
            <ProfileProperties>
                <ProfilePropertiesPrimary>
                    <Username username={user?.name} />
                    <Email email={user?.email} />
                    <Password />
                    <DeleteAccount />
                </ProfilePropertiesPrimary>
                <ProfilePropertiesSecundary>
                    <div className="w-3/10">statistics</div>
                    <div className="w-1/20"></div>
                    <div className='w-3/10'><FriendshipList /></div>
                    <div className="w-1/20"></div>
                    <div className='w-3/10'><FriendshipRequests /></div>
                </ProfilePropertiesSecundary>
            </ProfileProperties>
        </ProfileContainer >
    )
}

/* v8 ignore stop*/
