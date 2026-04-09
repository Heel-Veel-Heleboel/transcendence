import { JSX, } from "react"
import { ProfileContainer } from "../features/profile/ProfileContainer";
import { ProfileProperties, ProfilePropertiesSecundary } from "../features/profile/ProfileProperties";
import { CONFIG } from "../shared/config/AppConfig";
import { MainContainer } from "../components/layout/MainContainer";
import { Widget } from "../components/layout/Widget";
import { useParams } from "react-router-dom";
import { VisitorProfilePropertiesPrimary } from "../features/profile/VisitorProfileProperties";
import { VisitorProfileAvatar } from "../features/profile/VisitorProfileAvatar";


export function VisitorProfile(): JSX.Element {
    const { userId } = useParams();
    if (typeof userId === 'undefined') {
        return <div>error</div>
    }
    return (
        <MainContainer>
            <Widget logoPath={CONFIG.PROFILE_LOGO} title={CONFIG.PROFILE_TITLE} width="w-full" >
                <VisitorProfileContent userId={userId} />
            </Widget>
        </MainContainer>
    )
}

export function VisitorProfileContent({ userId }: { userId: string }): JSX.Element {
    return (
        <ProfileContainer >
            <VisitorProfileAvatar visitorId={userId} />
            <ProfileProperties>
                <VisitorProfilePropertiesPrimary userId={userId} />
                <ProfilePropertiesSecundary>
                    <div className="w-full">statistics</div>
                </ProfilePropertiesSecundary>
            </ProfileProperties>
        </ProfileContainer >
    )
}

