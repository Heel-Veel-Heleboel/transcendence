import { JSX } from "react";
import { CONFIG } from '../../constants/AppConfig.ts'

/* v8 ignore start */
export function GamesAvailable({ quickPlayContent, defaultContent, customizedContent }: { quickPlayContent: JSX.Element, defaultContent: JSX.Element, customizedContent: JSX.Element }): JSX.Element {
    return (
        <div className="min-h-full flex flex-col">
            <Terminal title={CONFIG.GAMES_QUICK_PLAY_TITLE} child={quickPlayContent} />
            <Terminal title={CONFIG.GAMES_DEFAULT_PLAY_TITLE} child={defaultContent} />
            <Terminal title={CONFIG.GAMES_CUSTOM_PLAY_TITLE} child={customizedContent} />
        </div>
    );
}

export function TitleBar({ logoPath, title }: { logoPath: string, title: string }): JSX.Element {
    return (
        <div className="border-1 border-black bg-pink-800 flex justify-between px-1">
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
        <div className="grow flex flex-col">
            <div className="border border-black">{title}</div>
            <div className="grow">{child}</div>
        </div>
    )
}

export function Widget({ logoPath, title, width, child }: { logoPath: string, title: string, width: string, child: JSX.Element }): JSX.Element {
    const outerContainerCss = `${width} flex flex-col grow`
    return (
        <div className={outerContainerCss}>
            <TitleBar logoPath={logoPath} title={title} />
            <div className="border border-black grow">
                {child}
            </div>
        </div>
    )
}

export function MainWindowContainer({ children }: { children: JSX.Element }): JSX.Element {
    return (
        <div className="p-2 min-w-full grow flex flex-col">
            {children}
        </div>
    )
}
/* v8 ignore stop */
