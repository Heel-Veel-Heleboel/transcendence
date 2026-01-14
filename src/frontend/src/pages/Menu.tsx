import { JSX } from "react"

export const Menu = (): JSX.Element => {
    return (
        <div id='Menu' className="w-full h-full flex flex-col">
            <Toolbar />
            <div id="backgroundImage" className="min-h-full flex flex-col bg-[url(/logan_4.jpg)]">

                <Widgets />
                <LiveChat />

            </div>

        </div>
    )
}

export function Toolbar(): JSX.Element {
    return (
        <div id="toolbar" className="w-full flex justify-between bg-sky-500">
            <div className="px-2">logo</div>
            <div className="">time</div>
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
        <div id="widgetContainer" className="p-2 min-h-1/2 min-w-full flex bg-sky-500/50 bg-clip-content">

            <Widget text='matchmaking' />
            <Widget text='tournaments' />
            <Widget text='neofetch' />
            <Widget text='music' />

        </div>
    )

}

export function Widget({ text }: { text: string }): JSX.Element {
    return (
        <div className="min-w-1/4 flex flex-col">
            <TitleBar logoPath="path" title="title" />
            <div className="border grow">
                <h1>{text}</h1>
            </div>
        </div>
    )
}

export function LiveChat(): JSX.Element {
    return (
        <div id="liveChat" className="p-2 h-full min-w-full flex flex-col bg-pink-300/50 bg-clip-content">
            <TitleBar logoPath="path" title='UrlChat' />
            <div className="flex grow">
                <LiveChatRooms />
                <Chat />
                <LiveChatUsers />
            </div>
        </div>
    )
}

export function TitleBar({ logoPath, title }: { logoPath: string, title: string }): JSX.Element {
    return (
        <div className="titleBarBorders border-1 bg-lime-300 flex justify-between px-1">
            <div>{logoPath}</div>
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

export function LiveChatRooms(): JSX.Element {
    return (
        <div className="w-1/6 border">Rooms</div>
    )
}

export function Chat(): JSX.Element {
    return (
        <div className="w-4/6 border">Chat</div>
    )
}

export function LiveChatUsers(): JSX.Element {
    return (
        <div className="w-1/6 border">Users</div>
    )
}
