import { JSX } from "react";

export function GamesAvailable({ quickPlayContent, defaultContent, customizedContent }: { quickPlayContent: JSX.Element, defaultContent: JSX.Element, customizedContent: JSX.Element }): JSX.Element {
    return (
        <div className="min-h-full flex flex-col">
            <Terminal title='Quick Play' child={quickPlayContent} />
            <Terminal title='Default' child={defaultContent} />
            <Terminal title='Customized' child={customizedContent} />
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
            {/*
                <a href="https://www.flaticon.com/free-icons/minus-button" title="minus button icons">Minus button icons created by Circlon Tech - Flaticon</a>
                <a href="https://www.flaticon.com/free-icons/maximize" title="maximize icons">Maximize icons created by Ranah Pixel Studio - Flaticon</a>
                <a href="https://www.flaticon.com/free-icons/close" title="close icons">Close icons created by Pixel perfect - Flaticon</a>
            */}
            <div className='w-20 flex'>
                <div className="px-2 py-2">
                    <img src='minimize.png' alt='minimize' />
                </div>
                <div className="px-2 py-2">
                    <img src='maximize.png' alt='maximize' />
                </div>
                <div className="px-2 py-2">
                    <img src='close.png' alt='close' />
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
