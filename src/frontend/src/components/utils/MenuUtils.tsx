import { JSX, ReactNode } from "react";
import { CONFIG } from '../../constants/AppConfig.ts'

/* v8 ignore start */
export function LobbyRoom({ title, gamesContent }: { title: string, gamesContent: JSX.Element }): JSX.Element {
    return (
        <div className="min-h-full flex flex-col border border-black">
            <Terminal title={title} child={gamesContent} />
        </div>
    );
}

export function TitleBar({ logoPath, title }: { logoPath: string, title: string }): JSX.Element {
    return (
        <div className="h-1/10 border-1 border-black bg-pink-800 flex justify-between px-1">
            <div className="w-5 py-1">
                <img src={logoPath} alt='logo' />
            </div>
            <div>{title}</div>
            <div className='w-20 flex'>
                <div className="px-2 py-2">
                    <img src={CONFIG.MINIMIZE_LOGO} alt={CONFIG.MINIMIZE_ALT} />
                </div>
                <div className="px-2 py-2">
                    <img src={CONFIG.MAXIMIZE_LOGO} alt={CONFIG.MAXIMIZE_ALT} />
                </div>
                <div className="px-2 py-2">
                    <img src={CONFIG.CLOSE_LOGO} alt={CONFIG.CLOSE_ALT} />
                </div>
            </div >
        </div>
    )
}

export function Terminal({ title, child }: { title: string, child: JSX.Element }): JSX.Element {
    return (
        <div id={`terminal-${title}`} className="border border-black min-h-full max-h-full flex flex-col">
            <div className="border border-black border-t border-l border-r text-center">{title}</div>
            <div className="min-h-full max-h-full overflow-auto">{child}</div>
        </div>
    )
}

export function Widget({ logoPath, title, width, child }: { logoPath: string, title: string, width: string, child: JSX.Element }): JSX.Element {
    const outerContainerCss = `${width} flex flex-col min-h-full`
    return (
        <div className={outerContainerCss} id={`widget-${title}`}>
            <TitleBar logoPath={logoPath} title={title} />

            {child}
        </div>
    )
}

export function MainWindowContainer({ children }: { children: ReactNode }): JSX.Element {
    return (
        <div id='MainWindowContainer' className="min-w-full min-h-full flex flex-col">
            {children}
        </div>
    )
}
/* v8 ignore stop */
