import { JSX } from "react";
import { useNavigate } from "react-router-dom";
import { RelationsColumn } from "./RelationsColumn";
import { Terminal } from "../../components/layout/Terminal";
import { IFriendship } from "../../shared/types/friendship";
import { useUserService } from "../../components/providers/User";

export function FriendshipList({ friends, onRefresh }: { friends: IFriendship[], onRefresh: () => void }) {
    const navigate = useNavigate();
    const service = useUserService();

    async function removeFriend(friendshipId: number) {
        try {
            await service.deleteFriendship(String(friendshipId));
            alert("Friendship Removed");
            onRefresh();
        } catch (error) {
            console.error("Error deleting friendship:", error);
            alert("friendship deletion failed");
        }
    }


    function FriendsContent(): JSX.Element {
        function List(list: IFriendship[]) {
            if (!list)
                return
            const listItems = list.map((item: IFriendship) =>
                <li key={item.id}>
                    <div className='flex justify-between' id={item.userName + '-container'}>
                        <button onClick={() => navigate('/profile/' + item.userId)} className="flex items-center gap-2">
                            {item.activityStatus === 'ONLINE' ? '🟢' : '🔴'} {item.userName}
                        </button>
                        <button onClick={() => removeFriend(item.id)} className="bg-red-500">remove</button>
                    </div>
                </li>
            );
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
            <Terminal title={'friends'}  >
                <FriendsContent />
            </Terminal>
        </RelationsColumn >
    )
}
