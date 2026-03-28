
import { JSX, useEffect, useState } from "react"
import { CONFIG } from "../constants/AppConfig";
import { MainContainer } from "../components/sections/MainContainer";
import { Widget } from "../components/utils/MenuUtils";
import { FriendshipList } from "../features/relationships/FriendshipList";
import { FriendshipRequests } from "../features/relationships/FriendshipRequests";
import { RelationsContainer } from "../features/relationships/RelationsContainer";
import { Blocked } from "../features/relationships/Blocked";
import { IFriendship, IFriendshipResponse, responseToFriendship } from "../types/friendship";
import { getCookie } from "../components/utils/cookies";
import api from "../api";


export function Relationships(): JSX.Element {
    return (
        <MainContainer children={
            <Widget logoPath={CONFIG.PROFILE_LOGO} title={CONFIG.PROFILE_TITLE} width="w-full" child={<RelationshipsContent />} />
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

