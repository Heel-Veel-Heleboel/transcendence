import { useEffect, useState } from "react";
import api from "../../api";
import { getCookie } from "../../components/utils/cookies";
import { CONFIG } from "../../constants/AppConfig";


async function friendshipBetween(userId1: string, userId2: string) {
    try {
        await api({
            url: CONFIG.REQUEST_FRIENDS_BETWEEN(userId1, userId2)
        })
        return true;
    } catch (e: any) {
        console.error(e);
        return false;
    }
}

export function AddFriend({ userId }: { userId: string }) {
    const [friendship, setFriendship] = useState<boolean>(false);

    useEffect(() => {
        const currentUserId = getCookie(CONFIG.USERID_COOKIE_NAME);
        async function getFriendshipBetween() {
            const result = await friendshipBetween(currentUserId, userId);
            console.log(result);
            setFriendship(result);
        }
        getFriendshipBetween();
    }, [])

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
            {friendship ?
                <div className="bg-green-500">Friend</div>
                :
                <button onClick={handleFriendshipRequest}>Add friend</button>
            }
        </div>

    )
}
