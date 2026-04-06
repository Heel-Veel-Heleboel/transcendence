import api from "../../shared/api/api";
import { getCookie } from "../../shared/utils/cookies";
import { CONFIG } from "../../shared/config/AppConfig";
import { IFriendship } from "../../shared/types/friendship";


export function AddFriend({ friendship, userId }: { friendship: IFriendship | null, userId: string }) {

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
            {friendship && friendship.status === 'ACCEPTED' ?
                <div className="bg-green-500">Friend</div>
                : friendship && friendship?.status === 'PENDING' ?
                    <div className="bg-blue-500">Pending</div>
                    : friendship && friendship?.status === 'BLOCKED' ?
                        null :
                        <button onClick={handleFriendshipRequest}>Add friend</button>
            }
        </div>

    )
}
