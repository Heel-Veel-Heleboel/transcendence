import { JSX } from "react";
import api from "../../shared/api/api";
import { CONFIG } from "../../shared/config/AppConfig";
import { RelationsColumn } from "./RelationsColumn";
import { Terminal } from "../../components/layout/Terminal";
import { IFriendship } from "../../shared/types/friendship";
import { useAuth } from "../../components/providers/Auth";

export function Blocked({ blocks, onRefresh }: { blocks: IFriendship[], onRefresh: () => void }) {
    const auth = useAuth();

    async function handleUnblock(blockedUserId: number) {
        try {
            await api({
                url: CONFIG.REQUEST_FRIEND_UNBLOCK,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({ blocker_id: Number(auth.userId), blocked_id: blockedUserId }),
            })
            onRefresh();
        } catch (error) {
            console.error(error);
            alert('handling unblock request failed!')
        }
    }

    function BlockContent(): JSX.Element {
        // Only show blocks the current user initiated (isRequester = they are the blocker)
        const myBlocks = blocks.filter((b) => b.isRequester);
        if (!myBlocks || myBlocks.length === 0) {
            return <div id="blocks" className="text-left">no blocked users</div>;
        }
        return (
            <div id="blocks" className="text-left">
                <ul>
                    {myBlocks.map((block) =>
                        <li key={block.userId}>
                            <div className="flex justify-between" id={block.userName + '-container'}>
                                {block.userName}
                                <button className="bg-green-500" onClick={() => handleUnblock(block.userId)}>unblock</button>
                            </div>
                        </li>
                    )}
                </ul>
            </div>
        )
    }

    return (
        <RelationsColumn>
            <Terminal title={'blocks'}>
                <BlockContent />
            </Terminal>
        </RelationsColumn>
    )
}
