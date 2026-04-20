import { JSX } from "react"
import { ProfileContainer } from "../features/profile/ProfileContainer";
import { ProfileAvatar } from "../features/profile/ProfileAvatar";
import { ProfileProperties, ProfilePropertiesPrimary, ProfilePropertiesSecundary } from "../features/profile/ProfileProperties";
import { ProfileStats } from "../features/profile/ProfileStats";
import { MatchHistory } from "../features/profile/MatchHistory";
import { CONFIG } from "../shared/config/AppConfig";
import { MainContainer } from "../components/layout/MainContainer";
import { Widget } from "../components/layout/Widget";

/* v8 ignore start */


export function Profile(): JSX.Element {
    return (
        <MainContainer>
            <Widget logoPath={CONFIG.PROFILE_LOGO} title={CONFIG.PROFILE_TITLE} width="w-full" >
                <UserProfileContent />
            </Widget>
        </MainContainer >
    )
}

export function UserProfileContent(): JSX.Element {
    return (
        <ProfileContainer >
            <ProfileAvatar />
            <ProfileProperties>
                <ProfilePropertiesPrimary />
                <ProfilePropertiesSecundary>
                    <div className="w-1/20"></div>
                    <div className="w-3/10 min-h-full">
                        <ProfileStats />
                    </div>
                    <div className="w-1/20"></div>
                    <div className="w-5/10 min-h-full">
                        <MatchHistory />
                    </div>
                    <div className="w-1/20"></div>
                </ProfilePropertiesSecundary>
            </ProfileProperties>
        </ProfileContainer >
    )
}

/* v8 ignore stop*/
