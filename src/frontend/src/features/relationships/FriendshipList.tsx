import { JSX, useEffect, useState } from "react";
import { IFriendship } from "../../types/friendship";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../../components/utils/cookies";
import api from "../../api";
import { CONFIG } from "../../constants/AppConfig";
import { IProfile } from "../../types/profile";
import { Terminal } from "../../components/utils/MenuUtils";

export function FriendshipList() {
    const [friends, setFriends] = useState<Array<IFriendship>>([])
    const [friendsProfiles, setFriendsProfiles] = useState<Map<number, { userID: number, userName: string }>>();
    const navigate = useNavigate();

    useEffect(() => {
        async function getFriends() {
            try {
                const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
                const result = await api({
                    url: CONFIG.REQUEST_FRIENDS(user_id)
                })
                console.log('friendslist');
                console.log(result.data);
                setFriends(result.data);
            } catch (error) {
                console.error(error);
            }
        }

        getFriends();
    }, [])

    useEffect(() => {
        async function getFriendsProfiles() {
            const profiles = new Map<number, { userID: number, userName: string }>()
            friends.forEach(async (friend) => {
                try {
                    const result = await api<IProfile>({
                        url: CONFIG.REQUEST_PROFILE + friend.user2_id
                    })
                    console.log('getRequestProfiles:\n')
                    console.log(result.data);
                    const userId = result.data.user_id;
                    const userName = result.data.user.name;
                    profiles.set(friend.id, { userID: userId, userName: userName });
                    setFriendsProfiles(profiles);
                } catch (error) {
                    console.error(error);
                }
            });
        }

        getFriendsProfiles()
    }, [friends])


    async function removeFriend(friendshipId: number) {
        try {
            await api({
                url: CONFIG.REQUEST_FRIEND_DELETE,
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json",
                },
                data: JSON.stringify({ id: friendshipId }),
            })
            alert("Friendship Removed");
        } catch (error) {
            console.error("Error deleting friendship:", error);
            alert("friendship deletion failed");
        }
    }


    const FriendsContent = (): JSX.Element => {
        function List(list: Map<number, { userID: number, userName: string }> | undefined) {
            if (!list)
                return
            const listItems = [...list].map(([friendShipId, { userID, userName }]) =>
                <li key={friendShipId}>
                    <div className='flex justify-between' id={userName + 'Container'}>
                        <button onClick={() => navigate('/profile/' + userID)}>
                            {userName}
                        </button>
                        <button onClick={() => removeFriend(friendShipId)} className="bg-red-500">remove</button>
                    </div>
                </li>
            );
            console.log('friends')
            console.log(listItems);
            return <ul>{listItems}</ul>;
        }
        return (
            <div id="friendship-list" className="text-left">
                {List(friendsProfiles)}
            </div>
        )
    }

    return (
        <div>
            <Terminal title={'friends'} child={FriendsContent()} />
        </div>
    )
}
