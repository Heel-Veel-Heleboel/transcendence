import { JSX, ReactNode } from "react";
import { Toolbar } from "./Toolbar";
import { MainWindowContainer } from "./MainWindowContainer";

export function MainContainer({ children }: { children: ReactNode }): JSX.Element {
    return (
        <div id='main-container' className="w-full h-full flex flex-col text-white">
            <Toolbar />
            {/*TODO: Change with p5 animation*/}
            <div id='bg-animation' className="flex flex-col h-29/30 bg-[url(/bg.jpg)] bg-cover">
                <MainWindowContainer >
                    {children}
                </MainWindowContainer >
            </div>
        </div>
    )
}
