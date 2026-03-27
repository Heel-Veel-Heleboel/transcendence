import { JSX, useEffect, useState } from "react"
import api from "../api";
import { CONFIG } from "../constants/AppConfig";
import { MainContainer } from "../components/sections/MainContainer";
import { Widget } from "../components/utils/MenuUtils";
import { useParams } from "react-router-dom";
import { IProfile } from "../types/profile";
import { ProfileAvatarContainer, ProfileName, ProfilePicture } from "../features/profile/ProfileAvatar";
import { ProfileContainer } from "../features/profile/ProfileContainer";
import { ProfileProperties, ProfilePropertiesPrimary, ProfilePropertiesSecundary } from "../features/profile/ProfileProperties";
import { AddFriend } from "../features/profile/AddFriend";
import { Status } from "../features/profile/Status";
import { ERRORS } from "../constants/Errors";
import { IFriendship, IFriendshipResponse, responseToFriendship } from "../types/friendship";
import { getCookie } from "../components/utils/cookies";
import { Blocked } from "../features/relationships/Blocked";
import { BlockUser } from "../features/profile/BlockUser";


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

async function friendshipBetween(currentUserId: string, otherUserId: string): Promise<IFriendship> {
    try {
        const result = await api<IFriendshipResponse>({
            url: CONFIG.REQUEST_FRIENDS_BETWEEN(currentUserId, otherUserId)
        })
        return (responseToFriendship(result.data, Number(currentUserId)));
    } catch (e: any) {
        console.error(e);
        return Promise.reject('friendship does not exist');
    }
}

export function VisitorProfileContent({ userId }: { userId: string }): JSX.Element {
    const [profile, setProfile] = useState<IProfile | null>(null);
    const [name, setName] = useState<string>('mysterio');
    const [status, setStatus] = useState<string>('OFFLINE');
    const [image, setImage] = useState<string>(CONFIG.PROFILE_DEFAULT_LOGO);
    const [friendship, setFriendship] = useState<IFriendship | null>(null);

    useEffect(() => {
        const currentUserId = getCookie(CONFIG.USERID_COOKIE_NAME);
        async function getfriendshipbetween() {
            const result = await friendshipBetween(currentUserId, userId);
            setFriendship(result);
        }
        getfriendshipbetween();
    }, [])

    useEffect(() => {
        async function getProfile() {
            try {
                const result = await api<IProfile>({
                    url: CONFIG.REQUEST_PROFILE + userId
                })
                console.log('getprofile');
                console.log(result);
                setProfile(result.data);
                setName(result.data.user.name)
                setStatus(result.data.user.activity_status)
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
                <ProfileName name={name} />
                <ProfilePicture image={image} />
                <div />
            </ProfileAvatarContainer >

            <ProfileProperties>
                <ProfilePropertiesPrimary>
                    <Status status={status} />
                    <AddFriend friendship={friendship} userId={userId} />
                    <BlockUser friendship={friendship} />
                </ProfilePropertiesPrimary>
                <ProfilePropertiesSecundary>
                    <div className="w-full">statistics</div>
                </ProfilePropertiesSecundary>
            </ProfileProperties>
        </ProfileContainer >
    )
}

