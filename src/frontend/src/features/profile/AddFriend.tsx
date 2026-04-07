import { IFriendship } from "../../shared/types/friendship";
import { useUserService } from "../../components/providers/User";


export function AddFriend({ friendship, userId }: { friendship: IFriendship, userId: string }) {
    const service = useUserService();

    async function handleFriendshipRequest() {
        try {
            await service.setFriendship(userId);
        }
        catch (e: any) {
            console.error(e);
            alert('friendship request failed');
        }
    }

    return (
        <div id="friendship-container">
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
