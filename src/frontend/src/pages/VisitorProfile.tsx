import { JSX, useEffect, useState } from "react"
import api from "../api";
import { CONFIG } from "../constants/AppConfig";
import { MainContainer } from "../components/sections/MainContainer";
import { Widget } from "../components/utils/MenuUtils";
import { useParams } from "react-router-dom";
import { IProfile } from "../types/profile";
import { ProfileAvatarContainer, ProfilePicture } from "../features/profile/ProfileAvatar";
import { ProfileContainer } from "../features/profile/ProfileContainer";
import { ProfileProperties, ProfilePropertiesPrimary, ProfilePropertiesSecundary } from "../features/profile/ProfileProperties";
import { AddFriend } from "../features/profile/AddFriend";
import { Status } from "../features/profile/Status";
import { ERRORS } from "../constants/Errors";


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

