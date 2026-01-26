import { JSX } from "react";
import { START_MENU_PAGE } from "../constants/Constants";
import { MenuOption } from "./StartMenuUtils";

export function Credits({ redirect }: { redirect: (page: number) => void }): JSX.Element {
    return (
        <div className="flex flex-col justify-between min-h-full text-white">
            <div />
            <CreditsSectionMembers />
            <CreditsSectionServices />
            <MenuOption text="BACK TO MENU" margin={0} callback={() => redirect(START_MENU_PAGE.MENU)} />
            <div />
        </div>
    )
}

export function CreditsSectionMembers(): JSX.Element {
    return (
        <div>
            <CreditsSectionTitle title="Members" />
            <CreditsSectionContentCenter value="amysiv" />
            <CreditsSectionContentCenter value="spenning" />
            <CreditsSectionContentCenter value="vshkonda" />
        </div>
    )

}

export function CreditsSectionServices(): JSX.Element {
    return (
        <div>
            <CreditsSectionTitle title="services" />
            <CreditsSectionContentSplit Key="api-gateway" value="vshkonda" />
            <CreditsSectionContentSplit Key="frontend" value="spenning" />
            <CreditsSectionContentSplit Key="user-management" value="amysiv" />
            <CreditsSectionContentSplit Key="auth" value="amysiv" />
            <CreditsSectionContentSplit Key="game-server" value="spenning" />
            <CreditsSectionContentSplit Key="observability" value="vshkonda" />
            <CreditsSectionContentSplit Key="matchmaking" value="vshkonda" />
            <CreditsSectionContentSplit Key="livechat" value="vshkonda" />
        </div>
    )

}

export function CreditsSectionContentSplit({ Key, value }: { Key: string, value: string }) {
    return (
        <div>
            <div className="flex justify-between text-2xl">
                <div className="font-orbi text-right w-3xs">{Key}</div>
                <div className="w-5"></div>
                <div className="font-orbi text-left w-3xs">{value}</div>
            </div>
        </div>
    )
}

export function CreditsSectionContentCenter({ value }: { value: string }) {
    return (
        <div>
            <div className="flex justify-between text-2xl">
                <div ></div>
                <div className="font-orbi text-center w-3xs">{value}</div>
                <div ></div>
            </div>
        </div>
    );

}

export function CreditsSectionTitle({ title }: { title: string }) {
    return (
        <div className="font-orbi text-6xl text-center">{title}</div>
    )
}
