
import { JSX } from "react"
import { CONFIG } from "../constants/AppConfig";
import { MainContainer } from "../components/sections/MainContainer";
import { Widget } from "../components/utils/MenuUtils";
import { FriendshipList } from "../features/relationships/FriendshipList";
import { FriendshipRequests } from "../features/relationships/FriendshipRequests";
import { RelationsContainer } from "../features/relationships/RelationsContainer";
import { Blocked } from "../features/relationships/Blocked";


export function Relationships(): JSX.Element {
    return (
        <MainContainer children={
            <Widget logoPath={CONFIG.PROFILE_LOGO} title={CONFIG.PROFILE_TITLE} width="w-full" child={<RelationshipsContent />} />
        } />
    )
}

export function RelationshipsContent(): JSX.Element {
    return (
        <RelationsContainer >
            <FriendshipList />
            <FriendshipRequests />
            <Blocked />
        </RelationsContainer >
    )
}

