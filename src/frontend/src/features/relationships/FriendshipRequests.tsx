import { JSX } from "react";
import api from "../../shared/api/api";
import { CONFIG } from "../../shared/config/AppConfig";
import { RelationsColumn } from "./RelationsColumn";
import { Terminal } from "../../components/layout/Terminal";
import { IFriendship } from "../../shared/types/friendship";
import { useAuth } from "../../components/providers/Auth";

export function FriendshipRequests({ requests }: { requests: IFriendship[] }) {
    const auth = useAuth();

    // Split into received (addressee) and sent (requester) pending requests
    const received = requests.filter((r) => !r.isRequester);
    const sent = requests.filter((r) => r.isRequester);

    async function handleFriendship(id: number, accept: boolean) {
        try {
            const status = accept ? 'ACCEPTED' : 'REJECTED'
            await api({
                url: CONFIG.REQUEST_FRIEND_UPDATE,
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({ id: String(id), status: status, addressee_id: Number(auth.userId) }),
            })

        } catch (error) {
            console.error(error);
            alert('handling friendship request failed!')
        }
    }

    async function handleCancelRequest(friendship_id: number) {
        try {
            await api({
                url: CONFIG.REQUEST_FRIEND_CANCEL,
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({ friendship_id, requester_id: Number(auth.userId) }),
            })
        } catch (error) {
            console.error(error);
            alert('cancelling friendship request failed!')
        }
    }

    function ReceivedList(list: IFriendship[]) {
        if (!list || list.length === 0)
            return <div>no incoming requests</div>;
        return (
            <ul>
                {list.map((request) =>
                    <li key={request.userId}>
                        <div className="flex justify-between" id={request.userName + '-container'}>
                            {request.userName}
                            <button className="bg-green-500" onClick={() => handleFriendship(request.id, true)}>accept</button>
                            <button className="bg-red-500" onClick={() => handleFriendship(request.id, false)}>reject</button>
                        </div>
                    </li>
                )}
            </ul>
        );
    }

    function SentList(list: IFriendship[]) {
        if (!list || list.length === 0)
            return <div>no outgoing requests</div>;
        return (
            <ul>
                {list.map((request) =>
                    <li key={request.userId}>
                        <div className="flex justify-between" id={request.userName + '-container'}>
                            {request.userName}
                            <span className="text-gray-400">pending</span>
                            <button className="bg-yellow-500" onClick={() => handleCancelRequest(request.id)}>cancel</button>
                        </div>
                    </li>
                )}
            </ul>
        );
    }

    function FriendshipRequestsContent(): JSX.Element {
        return (
            <div id="friendship-requests" className="text-left">
                <div>
                    <p className="font-bold">Incoming</p>
                    {ReceivedList(received)}
                </div>
                <div>
                    <p className="font-bold">Sent</p>
                    {SentList(sent)}
                </div>
            </div>
        )
    }

    return (
        <RelationsColumn>
            <Terminal title={'friendship-requests'}><FriendshipRequestsContent /></Terminal>
        </RelationsColumn>
    )
}
