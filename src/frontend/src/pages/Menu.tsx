import { JSX, useState, useEffect } from "react"
import platform from 'platform';
import { IAudioMetadata, IPicture, parseWebStream, selectCover } from 'music-metadata';
import { browsers } from "../utils/browserLogos";

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
            {/* TODO update with own logo*/}
            <div className="px-2">logo</div>
            {/* TODO change to realtime implementation*/}
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

            {/*
                <a href="https://www.flaticon.com/free-icons/matchmaker" title="matchmaker icons">Matchmaker icons created by Smashicons - Flaticon</a>
                <a href="https://www.flaticon.com/free-icons/structure" title="structure icons">Structure icons created by Irakun - Flaticon</a>
                <a href="https://www.flaticon.com/free-icons/crocodile" title="crocodile icons">Crocodile icons created by Freepik - Flaticon</a>
                <a href="https://www.flaticon.com/free-icons/vinyl" title="vinyl icons">Vinyl icons created by Roundicons - Flaticon</a>
            */}

            <Widget title="speedmatching" logoPath="matchmaker.png" />
            <Widget title="gymkhana" logoPath="gymkhana.png" />
            <Widget title="trinityfetch" logoPath="crocodile.png" child={TrinityFetch()} />
            <Widget title="mtvx" logoPath='vinyl.png' child={Mtvx()} />


        </div>
    )

}

export function TrinityFetch(): JSX.Element {
    // TODO add user@alias above info
    const browser = (platform.name === null) ? '?' : platform.name;
    const browserVersion = (platform.version === null) ? '?' : platform.version;
    const layout = (platform.layout === null) ? '?' : platform.layout;
    const os = (platform.os.family === null) ? '?' : platform.os.family;
    const osArchitecture = (platform.os.architecture === null) ? '?' : platform.os.architecture;
    const product = (platform.product === null) ? '?' : platform.product;
    const manufacturer = (platform.manufacturer === null) ? '?' : platform.manufacturer;
    // TODO update with p5 version
    const logo = (platform.name === null) ? '?' : browsers.get(platform.name)?.logo;
    return (
        <div className="flex min-h-full">
            <div className='min-h-full w-1/2'>
                <div className="whitespace-pre-wrap text-[3px] min-h-full">{logo}</div>

            </div>
            <div className="min-h-full w-1/2">
                <div className="min-h-full flex flex-col justify-between">
                    <div />
                    <div className="flex flex-col text-xs">
                        <p><span className="text-blue-600">browser</span>: {browser}</p>
                        <p><span className="text-blue-600">version</span>:{browserVersion}</p>
                        <p><span className="text-blue-600">layout</span>: {layout}</p>
                        <p><span className="text-blue-600">os</span>: {os}</p>
                        <p><span className="text-blue-600">architecture</span>: {osArchitecture}</p>
                        <p><span className="text-blue-600">product</span>: {product}</p>
                        <p><span className="text-blue-600">manufacturer</span>: {manufacturer}</p>
                    </div>
                    <div />
                </div>
            </div>
        </div>
    )
}


export function Mtvx(): JSX.Element {
    const [metaData, setMetaData] = useState<IAudioMetadata | null>(null);
    const [cover, setCover] = useState<IPicture | null>(null);
    const [mp3, setMp3] = useState<string | undefined>('60681z.mp3');
    // setMp3('60681z.mp3')
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (mp3) {
                    await fetch(mp3).then(async response => {
                        console.log(response);
                        const result = await parseMusic(response);
                        const coverResult = selectCover(result?.common.picture);
                        setMetaData(result);
                        setCover(coverResult);
                    })
                }
            }
            catch (error: any) {
                console.error('Error getting music:', error.message);
            }
        };
        fetchData();
    }, []);
    const title = (metaData === null) ? '?' : metaData.common.title;
    const album = (metaData === null) ? '?' : metaData.common.album;
    const artist = (metaData === null) ? '?' : metaData.common.artist;
    const duration = (metaData === null) ? '?' : metaData.format.duration;
    let formattedDuration;
    if (duration === '?') {
        formattedDuration = duration
    } else if (duration) {
        const minutes = Math.floor(duration / 60);
        const seconds = minutes % 60;
        if (seconds < 10) {
            formattedDuration = `${minutes}:0${seconds}`
        } else {
            formattedDuration = `${minutes}:${seconds}`
        }
    }
    if (cover) {
        console.log(cover);
        const img = document.getElementById('cover-art') as HTMLImageElement;
        img.src = URL.createObjectURL(
            new Blob([cover?.data], { type: 'image/jpg' } /* (1) */)
        );
    }
    if (mp3) {

        // const player = document.getElementById('audio-player') as HTMLSourceElement;
        // player.src = mp3;
    }

    return (
        <div className="flex min-h-full">
            <div className='min-h-full w-1/2'>
                <div className="min-h-full flex items-center justify-center">
                    <img className="w-1/2 h-1/2" alt="cover-art" id="cover-art" />
                </div>
            </div>
            <div className="min-h-full w-1/2">
                <div className="min-h-full flex flex-col justify-around">
                    <div />
                    <div className="flex flex-col text-xs">
                        <p><span className="text-blue-600">title</span>: {title}</p>
                        <p><span className="text-blue-600">artist</span>:{artist} </p>
                        <p><span className="text-blue-600">album</span>: {album}</p>
                        <p><span className="text-blue-600">duration</span>: {formattedDuration}</p>
                    </div>

                    <audio className="w-5/6" controls src={mp3}>

                        ohh hell no, your browser does not support the audio element #sad
                    </audio>
                </div>
            </div>
        </div>
    )
}

async function parseMusic(response: Response): Promise<IAudioMetadata | null> {
    let metadata = null;
    try {
        const contentLength = response.headers.get('Content-Length');
        const size = contentLength ? parseInt(contentLength, 10) : undefined;

        if (response) {
            metadata = await parseWebStream(response.body, {
                mimeType: response.headers.get('Content-Type'),
                size
            });
        } else {
            throw Error('no valid response');
        }
    } catch (error: any) {
        console.error('Error parsing metadata:', error.message);
    }
    return metadata;
}


export function Widget({ logoPath, title, child }: { logoPath: string, title: string, child: JSX.Element }): JSX.Element {
    return (
        <div className="min-w-1/4 flex flex-col">
            <TitleBar logoPath={logoPath} title={title} />
            <div className="border grow">
                {child}
            </div>
        </div>
    )
}

export function LiveChat(): JSX.Element {
    return (
        <div id="liveChat" className="p-2 h-full min-w-full flex flex-col bg-pink-300/50 bg-clip-content">
            {/*
                <a href="https://www.flaticon.com/free-icons/hive" title="hive icons">Hive icons created by gravisio - Flaticon</a>
            */}
            <TitleBar logoPath="beehive.png" title='UrlChat' />
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
