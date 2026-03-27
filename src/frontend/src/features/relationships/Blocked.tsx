import { JSX } from "react";
import api from "../../shared/api/api";
import { CONFIG } from "../../shared/config/AppConfig";
import { RelationsColumn } from "./RelationsColumn";
import { Terminal } from "../../components/layout/Terminal";
import { IFriendship } from "../../shared/types/friendship";

export function Blocked({ blocks }: { blocks: IFriendship[] }) {

    async function handleUnblock(id: number) {
        try {
            const status = 'ACCEPTED';
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
            alert('handling unblock request failed!')
        }
    }

    function BlockContent(): JSX.Element {
        function List(list: IFriendship[]) {
            if (!list)
                return
            const listItems = list.map((request) =>
                <li key={request.userId}>
                    <div className="flex justify-between" id={request.userName + '-container'}>
                        {request.userName}
                        <button className="bg-green-500" onClick={() => handleUnblock(request.id)}>unblock</button>
                    </div>
                </li>
            );
            console.log('blocks')
            console.log(listItems);
            return <ul>{listItems}</ul>;
        }
        return (
            <div id="blocks" className="text-left">
                {List(blocks)}
            </div>
        )
    }

    return (
        <RelationsColumn>
            <Terminal title={'blocks'}  >
                <BlockContent />
            </Terminal>
        </RelationsColumn>
    )
}
