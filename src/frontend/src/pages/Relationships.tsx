
import { JSX, useEffect, useState } from "react"
import api from "../shared/api/api";
import { CONFIG } from "../shared/config/AppConfig";
import { getCookie } from "../shared/utils/cookies";
import { MainContainer } from "../components/layout/MainContainer";
import { Widget } from "../components/layout/Widget";
import { IFriendship, IFriendshipResponse, responseToFriendship } from "../shared/types/friendship";
import { RelationsContainer } from "../features/relationships/RelationsContainer";
import { FriendshipList } from "../features/relationships/FriendshipList";
import { FriendshipRequests } from "../features/relationships/FriendshipRequests";
import { Blocked } from "../features/relationships/Blocked";


export function Relationships(): JSX.Element {
    return (
        <MainContainer children={
            <Widget logoPath={CONFIG.PROFILE_LOGO} title={CONFIG.PROFILE_TITLE} width="w-full" >
                <RelationshipsContent />
            </Widget>
        } />
    )
}

export function RelationshipsContent(): JSX.Element {
    const [friendships, setFriendships] = useState<Array<IFriendship>>([])

    useEffect(() => {
        async function getFriendships() {
            try {
                const currentUserId = getCookie(CONFIG.USERID_COOKIE_NAME);
                const result = await api<IFriendshipResponse[]>({
                    url: CONFIG.REQUEST_FRIEND_LIST + currentUserId
                })
                const friendships = result.data.map((friendship: IFriendshipResponse) => {
                    return responseToFriendship(friendship, Number(currentUserId));
                })
                console.log('friendslist');
                console.log(friendships);
                setFriendships(friendships)
            } catch (error) {
                console.error(error);
            }
        }
        getFriendships();
    }, [])

    return (
        <RelationsContainer >
            <FriendshipList friends={friendships.filter((friendship) => friendship.status === 'ACCEPTED')} />
            <FriendshipRequests requests={friendships.filter((friendship) => friendship.status === 'PENDING')} />
            <Blocked blocks={friendships.filter((friendship) => friendship.status === 'BLOCKED')} />
        </RelationsContainer >
    )
}

