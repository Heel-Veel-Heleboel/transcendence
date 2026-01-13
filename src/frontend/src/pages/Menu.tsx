import { JSX } from "react"

export const Menu = (): JSX.Element => {
    return (
        <div id='Menu' className="w-full h-full flex flex-col">
            <Toolbar />
            <div id="backgroundImage" className="min-h-full bg-[url(/logan_4.jpg)]">
                <div className="min-h-full flex flex-row">
                    <Widgets />
                    <LiveChat />
                </div>
            </div>

        </div>
    )
}

export function Toolbar(): JSX.Element {
    return (
        <div id="toolbar" className="w-full flex justify-end bg-sky-500">
            <div id="toolbarOptionsContainer" className="w-35 flex ">
                <ToolbarOption id='profile' src='profile.png' />
                <ToolbarOption id='settings' src='settings.png' />
                <ToolbarOption id='logout' src='logout.png' />
            </div>
        </div>
    )
}

export function ToolbarOption({ id, src }: { id: string, src: string }): JSX.Element {
    const divId = `toolbarOption${id}`;
    return (
        <div id={divId} className='flex px-2 py-1'>
            <img src={src} alt={id} />
        </div >
    )
}

export function Widgets(): JSX.Element {
    return (
        <div id="widgetContainer" className="p-2 min-h-full w-4/6 bg-sky-500/50 bg-clip-content">
            <div className="min-h-full flex flex-wrap">
                <Widget text='widget_1' />
                <Widget text='widget_2' />
                <Widget text='widget_3' />
                <Widget text='widget_4' />
            </div>
        </div>
    )

}

export function Widget({ text }: { text: string }): JSX.Element {
    return (
        <div className="w-1/2 min-h-1/2">
            <TitleBar logoPath="path" title="title" />
            <div className="border min-h-full">
                <h1>{text}</h1>
            </div>
        </div>
    )
}

export function LiveChat(): JSX.Element {
    return (
        <div id="liveChat" className="p-2 min-h-full w-2/6 bg-pink-300/50 bg-clip-content">
            <TitleBar logoPath="path" title='UorChat' />

        </div>
    )
}

export function TitleBar({ logoPath, title }: { logoPath: string, title: string }): JSX.Element {
    return (
        <div className="titleBarBorders border-1 bg-lime-300 flex justify-between px-1">
            <div>{logoPath}</div>
            <div>{title}</div>
            <div>buttons</div>
        </div>
    )
}
