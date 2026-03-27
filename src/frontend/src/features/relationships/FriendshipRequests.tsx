import { JSX } from "react";
import { IFriendship } from "../../types/friendship";
import api from "../../api";
import { CONFIG } from "../../constants/AppConfig";
import { Terminal } from "../../components/utils/MenuUtils";
import { RelationsColumn } from "./RelationsColumn";

export function FriendshipRequests({ requests }: { requests: IFriendship[] }) {

    async function handleFriendship(id: number, accept: boolean) {
        try {
            const status = accept ? 'ACCEPTED' : 'REJECTED'
            await api({
                url: CONFIG.REQUEST_FRIEND_UPDATE,
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({ id: String(id), status: status }),
            })

        } catch (error) {
            console.error(error);
            alert('handling friendship request failed!')
        }
    }

    function FriendshipRequestsContent(): JSX.Element {
        function List(list: IFriendship[]) {
            if (!list)
                return
            const listItems = list.map((request) =>
                <li key={request.userId}>
                    <div className="flex justify-between" id={request.userName + '-container'}>
                        {request.userName}
                        <button className="bg-green-500" onClick={() => handleFriendship(request.id, true)}>accept</button>
                        <button className="bg-red-500" onClick={() => handleFriendship(request.id, false)}>reject</button>
                    </div>
                </li>
            );
            console.log('requests')
            console.log(listItems);
            return <ul>{listItems}</ul>;
        }
        return (
            <div id="friendship-requests" className="text-left">
                {List(requests)}
            </div>
        )
    }

    return (
        <RelationsColumn>
            <Terminal title={'friendship-requests'} child={FriendshipRequestsContent()} />
        </RelationsColumn>
    )
}
