import { JSX, ReactNode } from "react";
import { Toolbar } from "./Toolbar";
import { MainWindowContainer } from "./MainWindowContainer";
import { BackgroundAnimation } from "./BackgroundAnimation";

export function MainContainer({ children }: { children: ReactNode }): JSX.Element {
    return (
        <div id='main-container' className="w-full h-full flex flex-col text-white">
            <Toolbar />
            <div id='bg-animation' className="flex flex-col h-29/30">
                <BackgroundAnimation />
                <MainWindowContainer >
                    {children}
                </MainWindowContainer >
            </div>
        </div>
    )
}
