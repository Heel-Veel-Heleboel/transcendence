import { JSX } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { CONFIG } from "../../constants/AppConfig";
import { Terminal } from "../../components/utils/MenuUtils";
import { RelationsColumn } from "./RelationsColumn";
import { IFriendship } from "../../types/friendship";

export function FriendshipList({ friends }: { friends: IFriendship[] }) {
    const navigate = useNavigate();

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
        function List(list: IFriendship[]) {
            if (!list)
                return
            const listItems = list.map((item: IFriendship) =>
                <li key={item.id}>
                    <div className='flex justify-between' id={item.userName + '-container'}>
                        <button onClick={() => navigate('/profile/' + item.userId)}>
                            {item.userName}
                        </button>
                        <button onClick={() => removeFriend(item.id)} className="bg-red-500">remove</button>
                    </div>
                </li>
            );
            console.log('friends')
            console.log(listItems);
            return <ul>{listItems}</ul>;
        }
        return (
            <div id="friendship-list" className="text-left">
                {List(friends)}
            </div>
        )
    }

    return (
        <RelationsColumn>
            <Terminal title={'friends'} child={FriendsContent()} />
        </RelationsColumn>
    )
}
