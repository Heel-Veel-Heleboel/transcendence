import { IFriendship } from "../../shared/types/friendship";
import { useUserService } from "../../components/providers/User";
import { useAuth } from "../../components/providers/Auth";


export function AddFriend({ friendship, userId, onRefresh }: { friendship: IFriendship | null, userId: string, onRefresh: () => void }) {
    const service = useUserService();
    const auth = useAuth();

    async function handleFriendshipRequest() {
        try {
            await service.setFriendship(userId);
            onRefresh();
        }
        catch (e: any) {
            console.error(e);
            alert('friendship request failed');
        }
    }

    async function handleCancelRequest() {
        try {
            await service.cancelFriendshipRequest({
                friendship_id: friendship!.id,
                requester_id: Number(auth.userId),
            });
            onRefresh();
        }
        catch (e: any) {
            console.error(e);
            alert('cancelling friendship request failed');
        }
    }

    if (friendship && friendship.status === 'ACCEPTED') {
        return <div className="bg-green-500">Friend</div>;
    }
    if (friendship && friendship.status === 'PENDING') {
        if (friendship.isRequester) {
            return <button className="bg-yellow-500 hover:opacity-80" onClick={handleCancelRequest}>Cancel request</button>;
        }
        // Addressee sees nothing here — they handle it in the requests page
        return <div className="bg-blue-500">Request pending</div>;
    }
    if (friendship && friendship.status === 'BLOCKED') {
        // Don't show add-friend when there's a block in any direction
        return null;
    }

    return (
        <div id="friendship-container">
            <button onClick={handleFriendshipRequest} className="hover:underline">Add friend</button>
        </div>
    );
}
