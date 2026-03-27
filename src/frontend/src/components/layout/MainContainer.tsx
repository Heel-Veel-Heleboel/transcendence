import { JSX, ReactNode } from "react";
import { Toolbar } from "./Toolbar";
import { MainWindowContainer } from "../utils/MenuUtils";

export function MainContainer({ children }: { children: ReactNode }): JSX.Element {
    return (
        <div className="w-full h-full flex flex-col text-white">
            <Toolbar />
            {/*TODO: Change with p5 animation*/}
            <div className="flex flex-col h-19/20 bg-[url(/bg.jpg)] bg-cover">
                <MainWindowContainer children={children} />
            </div>
        </div>
    )
}
