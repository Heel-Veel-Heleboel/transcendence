
import { JSX, useEffect, useState } from "react";
import { IFriendship } from "../../types/friendship";
import { getCookie } from "../../components/utils/cookies";
import api from "../../api";
import { CONFIG } from "../../constants/AppConfig";
import { IProfile } from "../../types/profile";
import { Terminal } from "../../components/utils/MenuUtils";
import { RelationsColumn } from "./RelationsColumn";

export function FriendshipRequests() {
    const [requests, setRequests] = useState<Array<IFriendship>>([])
    const [requestProfiles, setRequestProfiles] = useState<Map<number, string>>();

    useEffect(() => {
        async function getFriendsRequests() {
            try {
                const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
                const result = await api({
                    url: CONFIG.REQUEST_FRIEND_REQUESTS(user_id)
                })
                setRequests(result.data);
                console.log('getFriendsRequests')
                console.log(result.data);
            } catch (error) {
                console.error(error);
            }
        }

        getFriendsRequests();
    }, [])

    useEffect(() => {
        async function getRequestProfiles() {
            const profiles = new Map<number, string>()
            requests.forEach(async (request) => {
                try {
                    const result = await api<IProfile>({
                        url: CONFIG.REQUEST_PROFILE + request.user2_id
                    })
                    console.log('getRequestProfiles:\n')
                    console.log(result.data);
                    profiles.set(request.id, result.data.user.name);
                    setRequestProfiles(profiles);
                } catch (error) {
                    console.error(error);
                }
            });
        }

        getRequestProfiles()
    }, [requests])

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

    const FriendshipRequestsContent = (): JSX.Element => {
        function List(list: Map<number, string> | undefined) {
            if (!list)
                return
            const listItems = [...list].map(([friendshipId, friendName]) =>
                <li key={friendshipId}>
                    <div className="flex justify-between" id={friendName + '-container'}>
                        {friendName}
                        <button className="bg-green-500" onClick={() => handleFriendship(friendshipId, true)}>accept</button>
                        <button className="bg-red-500" onClick={() => handleFriendship(friendshipId, false)}>reject</button>
                    </div>
                </li>
            );
            console.log('listitems')
            console.log(listItems);
            return <ul>{listItems}</ul>;
        }
        console.log('requests')
        console.log(requests);

        return (
            <div id="friendship-requests" className="text-left">
                {List(requestProfiles)}
            </div>
        )
    }

    return (
        <RelationsColumn>
            <Terminal title={'friendship-requests'} child={FriendshipRequestsContent()} />
        </RelationsColumn>
    )
}
