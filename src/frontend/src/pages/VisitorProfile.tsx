import { BaseSyntheticEvent, JSX, ReactNode, useEffect, useState } from "react"
import api from "../api";
import { CONFIG } from "../constants/AppConfig";
import { getCookie } from "../components/utils/cookies";
import { ERRORS } from "../constants/Errors";
import { MainContainer } from "../components/sections/MainContainer";
import { Widget } from "../components/utils/MenuUtils";
import { useNavigate, useParams } from "react-router-dom";
import { IProfile, IUser } from "../types/profile";
import { ProfileAvatarContainer, ProfileContainer, ProfilePicture, ProfileProperties, ProfilePropertiesPrimary, ProfilePropertiesSecundary } from "./Profile";
import { useAuth } from "../components/providers/Auth";

export function VisitorProfile(): JSX.Element {
    const { userId } = useParams();
    if (typeof userId === 'undefined') {
        return <div>error</div>
    }
    return (
        <MainContainer children={
            <Widget logoPath={CONFIG.PROFILE_LOGO} title={CONFIG.PROFILE_TITLE} width="w-full" child={<VisitorProfileContent userId={userId} />} />
        } />
    )
}

export function VisitorProfileContent({ userId }: { userId: string }): JSX.Element {
    const [profile, setProfile] = useState<IProfile | null>(null);
    const [image, setImage] = useState<string>(CONFIG.PROFILE_DEFAULT_LOGO);

    useEffect(() => {
        async function getProfile() {
            try {
                const result = await api<IProfile>({
                    url: CONFIG.REQUEST_PROFILE + userId
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
    }, [])

    useEffect(() => {
        async function getPicture() {
            try {
                if (profile?.avatar_url === null) {
                    setImage(CONFIG.PROFILE_DEFAULT_LOGO);
                    return;
                }
                const result = await api({
                    url: profile?.avatar_url,
                    responseType: 'blob'
                })
                console.log(result.data)
                const imageObjectUrl = URL.createObjectURL(result.data);
                setImage(CONFIG.REQUEST_PROFILE_PICTURE + imageObjectUrl);
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
                <ProfilePicture username={profile?.user?.name} image={image} />
            </ProfileAvatarContainer >

            <ProfileProperties>
                <ProfilePropertiesPrimary>
                    <Status status={profile?.user.activity_status} />
                    <AddFriend userId={userId} />
                </ProfilePropertiesPrimary>
                <ProfilePropertiesSecundary>
                    <div className="w-4/10">statistics</div>
                    <div className="w-2/10" />
                    <div className='w-4/10'>friends list</div>
                </ProfilePropertiesSecundary>
            </ProfileProperties>
        </ProfileContainer >
    )
}

export function AddFriend({ userId }: { userId: string }) {

    async function handleFriendshipRequest() {
        const currentUserId = getCookie(CONFIG.USERID_COOKIE_NAME);
        try {
            await api({
                url: CONFIG.REQUEST_FRIEND_ADD,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({ user1_id: currentUserId, user2_id: userId }),
            })
        }
        catch (e: any) {
            console.error(e);
            alert('friendship request failed');
        }

    }

    return (
        <div id="FriendshipContainer">
            <button onClick={handleFriendshipRequest}>Add friend</button>
        </div>

    )
}

export function Status({ status }: { status: string | undefined }) {
    return (
        <div id="StatusContainer">
            {status === 'ONLINE' ? '🟢' : '🔴'} {status?.toLowerCase()}
        </div>

    )
}
