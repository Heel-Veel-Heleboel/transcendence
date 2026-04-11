import { useLocation } from "react-router-dom";
import { MainContainer } from "../components/layout/MainContainer";
import { Widget } from "../components/layout/Widget";
import { CenterFlexContainer } from "../components/layout/CenteredFlexContainer";
import { CONFIG } from "../shared/config/AppConfig";
import { TournamentCreationForm } from "../features/matchmaking/TournamentCreationForm";

export function TournamentCreation() {
    const { state } = useLocation();

    return (
        <MainContainer >
            <Widget logoPath={CONFIG.TOURNAMENT_LOGO} title={'tournament creation'} width="w-full" >
                <CenterFlexContainer >
                    <TournamentCreationForm mode={state.mode} />
                </CenterFlexContainer >
            </Widget>
        </MainContainer >
    )

}

