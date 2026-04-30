
import { useEffect, useState } from "react";
import { useUserService } from "../../components/providers/User";
import { IProfile } from "../../shared/types/profile";
import { DEFAULT_AVATAR, DEFAULT_PROFILE } from "../../shared/constants/defaults";
import { useAuth } from "../../components/providers/Auth";
import { useNotifications } from "../../components/hooks/Notifications";
import { Status } from "./Status";
import { ProfilePictureImage } from "./ProfilePictureImage";
import { ProfilePictureContainer } from "./ProfilePictureContainer";
import { ProfileAvatarContainer } from "./ProfileAvatarContainer";
import { ProfileName } from "./ProfileName";

export function VisitorProfileAvatar({ visitorId }: { visitorId?: string }) {
    const userService = useUserService();
    const auth = useAuth();
    const { userStatusUpdate } = useNotifications();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [profile, setProfile] = useState<IProfile>(DEFAULT_PROFILE);

    const watchedId = visitorId ?? auth.userId;

    useEffect(() => {
        async function getProfile() {
            try {
                const result = await userService.getProfile(watchedId);
                setProfile(result.data);
            } catch (e: any) {
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        getProfile();
    }, [])

    useEffect(() => {
        if (userStatusUpdate && String(userStatusUpdate.userId) === String(watchedId)) {
            setProfile(prev => ({
                ...prev,
                user: { ...prev.user, activity_status: userStatusUpdate.activityStatus as IProfile['user']['activity_status'] }
            }));
        }
    }, [userStatusUpdate])

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
            <div id="visitor-activity-status">
                <Status status={profile.user.activity_status} />
                <ProfileName name={profile.user.name} />
            </div>
            <VisitorProfilePicture profile={profile} />
        </ProfileAvatarContainer>
    )
}

export function VisitorProfilePicture({ profile }: { profile: IProfile }) {

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
            <ProfilePictureImage image={image} />
        </ProfilePictureContainer>
    )
}
