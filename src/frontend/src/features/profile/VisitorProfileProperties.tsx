import { useCallback, useEffect, useState } from "react"
import { useUserService } from "../../components/providers/User";
import { ProfilePropertiesPrimaryContainer } from "./ProfileProperties";
import { AddFriend } from "./AddFriend";
import { BlockUser } from "./BlockUser";
import { IFriendship } from "../../shared/types/friendship";
import { useNotifications } from "../../components/hooks/Notifications";

export function VisitorProfilePropertiesPrimary({ userId }: { userId: string }) {
    const service = useUserService();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const notif = useNotifications();
    const [friendship, setFriendship] = useState<IFriendship | null>(null);

    const refresh = useCallback(async () => {
        try {
            const result = await service.getFriendship(userId);
            setFriendship(result);
            setError(false);
        } catch (e: any) {
            // 404 means no relationship exists yet — not an error
            if (e?.response?.status === 404) {
                setFriendship(null);
            } else {
                setError(true);
            }
        } finally {
            setLoading(false);
        }
    }, [userId])

    useEffect(() => {
        refresh();
    }, [refresh, notif.friendshipUpdate])

    if (loading) {
        return (
            <ProfilePropertiesPrimaryContainer>
                <div>loading</div>
            </ProfilePropertiesPrimaryContainer>
        );
    }
    if (error) {
        return (
            <ProfilePropertiesPrimaryContainer>
                <div>error</div>
            </ProfilePropertiesPrimaryContainer>
        );
    }

    return (
        <ProfilePropertiesPrimaryContainer>
            <AddFriend friendship={friendship} userId={userId} onRefresh={refresh} />
            <BlockUser friendship={friendship} userId={userId} onRefresh={refresh} />
        </ProfilePropertiesPrimaryContainer>
    )
}
