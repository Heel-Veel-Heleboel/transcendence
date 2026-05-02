import { JSX, useState, } from "react"
import { ProfileContainer } from "../features/profile/ProfileContainer";
import { ProfileProperties, ProfilePropertiesSecundary } from "../features/profile/ProfileProperties";
import { ProfileStats } from "../features/profile/ProfileStats";
import { MatchHistory } from "../features/profile/MatchHistory";
import { CONFIG } from "../shared/config/AppConfig";
import { MainContainer } from "../components/layout/MainContainer";
import { Widget } from "../components/layout/Widget";
import { useParams } from "react-router-dom";
import { VisitorProfilePropertiesPrimary } from "../features/profile/VisitorProfileProperties";
import { VisitorProfileAvatar } from "../features/profile/VisitorProfileAvatar";
import { NotFound } from "../features/errors/NotFound";


export function VisitorProfile(): JSX.Element {
    const { userId } = useParams();

    if (typeof userId === 'undefined') {
        return <NotFound />
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
    const [errorPage, setErrorPage] = useState<boolean>(false);

    return (
        <ProfileContainer >
            {!errorPage ?
                <div className="h-full w-full">
                    <VisitorProfileAvatar visitorId={userId} setErrorPage={setErrorPage} />
                    <ProfileProperties>
                        <VisitorProfilePropertiesPrimary userId={userId} />
                        <ProfilePropertiesSecundary>
                            <div className="w-3/10">
                                <ProfileStats userId={userId} />
                            </div>
                            <div className="w-1/20"></div>
                            <div className="w-5/10 min-h-1/2">
                                <MatchHistory userId={userId} />
                            </div>
                            <div className="w-1/20"></div>
                        </ProfilePropertiesSecundary>
                    </ProfileProperties>
                </div> :
                <NotFound />
            }
        </ProfileContainer >
    )
}

