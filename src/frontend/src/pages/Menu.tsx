import { JSX, useState, useEffect } from "react"
import { useNavigate } from 'react-router-dom';
import platform from 'platform';
import { IAudioMetadata, IPicture, parseWebStream, selectCover } from 'music-metadata';
import { browsers } from "../utils/browserLogos";

const PAGE = Object.freeze({
    MENU: 0,
    PROFILE: 1,
    SETTINGS: 2
})

export const Menu = (): JSX.Element => {
    const [page, setPage] = useState<number>(PAGE.MENU);

    function redirect(page: number) {
        setPage(page);
    }

    return (
        <div id='Menu' className="w-full h-full flex flex-col text-white">
            <Toolbar redirect={redirect} />
            <div id="backgroundImage" className="flex flex-col grow bg-[url(/bg.jpg)] bg-cover">
                <MainWindowContainer children={<GetPage page={page} />} />
            </div>
        </div>
    )
}

export function GetPage({ page }: { page: number }): JSX.Element {
    switch (page) {
        case PAGE.MENU:
            return <DefaultMenu />
        case PAGE.PROFILE:
            return <Widget logoPath="profile.png" title="profile" width="w-full" child={<Profile />} />
        case PAGE.SETTINGS:
            return <Widget logoPath="settings.png" title="settings" width="w-full" child={<Settings />} />
        default:
            return <DefaultMenu />
    }
}

export function DefaultMenu(): JSX.Element {
    return (
        <>
            <Widgets />
            <LiveChat />
        </>
    )
}

export function MainWindowContainer({ children }: { children: JSX.Element }): JSX.Element {
    return (
        <div className="p-2 min-w-full grow flex flex-col">
            {children}
        </div>
    )
}

export function Profile(): JSX.Element {
    return (
        <div className="min-h-full min-w-full bg-emerald-500/50">Profile</div>
    )

}

export function Settings(): JSX.Element {
    return (
        <div className="min-h-full min-w-full bg-purple-500/50">Settings</div>
    )
}

export function Toolbar({ redirect }: { redirect: (page: number) => void }): JSX.Element {
    const time = localeDate();
    const navigate = useNavigate();
    return (
        <div id="toolbar" className="w-full flex justify-between bg-gradient-to-r from-violet-800 from-10% via-orange-500 via-80% to-zinc-400 to-90%">
            {/* TODO update with own logo*/}
            <div className="px-2 py-2" onClick={() => redirect(PAGE.MENU)}>logo</div>
            <div className="py-2">{`${time.date} - ${time.time}`}</div>
            <div id="toolbarOptionsContainer" className="w-35 flex ">
                <ToolbarOption id='profile' src='profile.png' callback={() => redirect(PAGE.PROFILE)} />
                <ToolbarOption id='settings' src='settings.png' callback={() => redirect(PAGE.SETTINGS)} />
                <ToolbarOption id='logout' src='logout.png' callback={() => navigate("/")} />
            </div>
        </div>
    )
}

export function ToolbarOption({ id, src, callback }: { id: string, src: string, callback: () => void }): JSX.Element {
    const divId = `toolbarOption${id}`;
    return (
        <div id={divId} className='flex px-2 py-1'>
            <img src={src} alt={id} onClick={callback} />
        </div >
    )
}


export function localeDate() {
    const locale = 'en-GB';
    const [today, setDate] = useState(new Date()); // Save the current date to be able to trigger an update

    useEffect(() => {
        const timer = setInterval(() => { // Creates an interval which will update the current data every minute
            // This will trigger a rerender every component that uses the useDate hook.
            setDate(new Date());
        }, 1 * 1000);
        return () => {
            clearInterval(timer); // Return a funtion to clear the timer so that it will stop being called on unmount
        }
    }, []);

    const date = today.toLocaleDateString(locale, { year: '2-digit', month: 'numeric', day: 'numeric' });
    const time = today.toLocaleTimeString(locale, { hour: 'numeric', minute: 'numeric' });

    return {
        date,
        time
    };
};


export function Widgets(): JSX.Element {
    const widgetWidth = "w-1/4"
    return (
        <div id="widgetContainer" className="min-h-1/2 min-w-full flex bg-sky-800/60 bg-clip-content">

            {/*
                <a href="https://www.flaticon.com/free-icons/matchmaker" title="matchmaker icons">Matchmaker icons created by Smashicons - Flaticon</a>
                <a href="https://www.flaticon.com/free-icons/structure" title="structure icons">Structure icons created by Irakun - Flaticon</a>
                <a href="https://www.flaticon.com/free-icons/crocodile" title="crocodile icons">Crocodile icons created by Freepik - Flaticon</a>
                <a href="https://www.flaticon.com/free-icons/vinyl" title="vinyl icons">Vinyl icons created by Roundicons - Flaticon</a>
            */}

            <Widget title="speedmatching" logoPath="matchmaker.png" width={widgetWidth} child={Speedmatching()} />
            <Widget title="gymkhana" logoPath="gymkhana.png" width={widgetWidth} child={Gymkhana()} />
            <Widget title="trinityfetch" logoPath="crocodile.png" width={widgetWidth} child={TrinityFetch()} />
            <Widget title="mtvx" logoPath='vinyl.png' width={widgetWidth} child={Mtvx()} />


        </div>
    )

}

export function Gymkhana(): JSX.Element {
    const quickPlayContent = (): JSX.Element => {
        return (
            <div>content</div>
        )
    }
    const defaultContent = (): JSX.Element => {
        return (
            <div>content</div>
        )
    }
    const customizedContent = (): JSX.Element => {
        return (
            <div>content</div>
        )
    }
    return (
        <GamesAvailable quickPlayContent={quickPlayContent()} defaultContent={defaultContent()} customizedContent={customizedContent()} />
    )
}

export function Speedmatching(): JSX.Element {
    const quickPlayContent = (): JSX.Element => {
        return (
            <div>content</div>
        )
    }
    const defaultContent = (): JSX.Element => {
        return (
            <div>content</div>
        )
    }
    const customizedContent = (): JSX.Element => {
        return (
            <div>content</div>
        )
    }
    return (
        <GamesAvailable quickPlayContent={quickPlayContent()} defaultContent={defaultContent()} customizedContent={customizedContent()} />
    )
}

export function GamesAvailable({ quickPlayContent, defaultContent, customizedContent }: { quickPlayContent: JSX.Element, defaultContent: JSX.Element, customizedContent: JSX.Element }): JSX.Element {
    return (
        <div className="min-h-full flex flex-col">
            <Terminal title='Quick Play' child={quickPlayContent} />
            <Terminal title='Default' child={defaultContent} />
            <Terminal title='Customized' child={customizedContent} />
        </div>
    );
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
                        <p><span className="text-green-500">browser</span>: {browser}</p>
                        <p><span className="text-green-500">version</span>:{browserVersion}</p>
                        <p><span className="text-green-500">layout</span>: {layout}</p>
                        <p><span className="text-green-500">os</span>: {os}</p>
                        <p><span className="text-green-500">architecture</span>: {osArchitecture}</p>
                        <p><span className="text-green-500">product</span>: {product}</p>
                        <p><span className="text-green-500">manufacturer</span>: {manufacturer}</p>
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
                        <p><span className="text-green-400">title</span>: {title}</p>
                        <p><span className="text-green-400">artist</span>:{artist} </p>
                        <p><span className="text-green-400">album</span>: {album}</p>
                        <p><span className="text-green-400">duration</span>: {formattedDuration}</p>
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

export function LiveChat(): JSX.Element {
    return (
        <div id="liveChat" className="min-h-1/2 min-w-full flex flex-col bg-zinc-800/50 bg-clip-content">
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

export function LiveChatRooms(): JSX.Element {
    const roomsContent = (): JSX.Element => {
        return (
            <div>Room content</div>
        )
    }
    return (
        <div className="w-1/6 border border-black">
            <Terminal title="Rooms" child={roomsContent()} />
        </div>
    )
}

export function Chat(): JSX.Element {
    const chatContent = (): JSX.Element => {
        return (
            <div>Chat content</div>
        )
    }
    return (
        <div className="w-4/6 border border-black">
            <Terminal title="Chat" child={chatContent()} />
        </div>
    )
}

export function LiveChatUsers(): JSX.Element {
    const userContent = (): JSX.Element => {
        return (
            <div>user content</div>
        )
    }
    return (
        <div className="w-1/6 border border-black">
            <Terminal title="Users" child={userContent()} />
        </div>
    )
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
