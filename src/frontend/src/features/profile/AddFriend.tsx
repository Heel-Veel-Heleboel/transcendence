import api from "../../api";
import { getCookie } from "../../components/utils/cookies";
import { CONFIG } from "../../constants/AppConfig";

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
