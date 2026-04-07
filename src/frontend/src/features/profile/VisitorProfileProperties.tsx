import { useEffect, useState } from "react"
import { useUserService } from "../../components/providers/User";
import { ProfilePropertiesPrimaryContainer } from "./ProfileProperties";
import { AddFriend } from "./AddFriend";
import { BlockUser } from "./BlockUser";
import { IFriendship } from "../../shared/types/friendship";
import { DEFAULT_FRIENDSHIP } from "../../shared/constants/defaults";

export function VisitorProfilePropertiesPrimary({ userId }: { userId: string }) {
    const service = useUserService();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [friendship, setFriendship] = useState<IFriendship>(DEFAULT_FRIENDSHIP);

    useEffect(() => {
        async function getUser() {
            try {
                const result = await service.getFriendship(userId);
                setFriendship(result);
            } catch (e: any) {
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        getUser();
    }, [])

    if (loading) {
        <ProfilePropertiesPrimaryContainer>
            <div>loading</div>
        </ProfilePropertiesPrimaryContainer>
    }
    if (error) {
        <ProfilePropertiesPrimaryContainer>
            <div>error</div>
        </ProfilePropertiesPrimaryContainer>
    }

    return (
        <ProfilePropertiesPrimaryContainer>
            <AddFriend friendship={friendship} userId={userId} />
            <BlockUser friendship={friendship} />
        </ProfilePropertiesPrimaryContainer>
    )
}


