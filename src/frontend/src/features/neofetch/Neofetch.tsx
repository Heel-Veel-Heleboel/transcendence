import { JSX } from 'react';
import platform from 'platform';

/* v8 ignore start*/
export function Neofetch(): JSX.Element {
    // TODO add user@alias above info
    const browser = (platform.name === null) ? '?' : platform.name;
    const browserVersion = (platform.version === null) ? '?' : platform.version;
    const layout = (platform.layout === null) ? '?' : platform.layout;
    const os = (platform.os?.family === null) ? '?' : platform.os?.family;
    const osArchitecture = (platform.os?.architecture === null) ? '?' : platform.os?.architecture;
    const logo = (typeof platform.name === 'undefined') ? '?' : (browsers.get(platform.name)?.logo);
    return (
        <div id='neofetch' className="flex min-h-14/15 border bg-zinc-800/50">
            <div className='min-h-full w-1/2 flex flex-col justify-around'>
                <div />
                <div className='flex justify-around'>
                    <div />
                    <div className='h-2/3 w-2/3'>
                        <img src={logo} alt="browser_logo" />
                    </div>
                    <div />
                </div>
                <div />

            </div>
            <div className="min-h-full w-1/2 ">
                <div className="min-h-full flex flex-col justify-between">
                    <div />
                    <div className='justify-around flex text-xs'>
                        <div className='text-green-500'>
                            <p>browser:</p>
                            <p>version:</p>
                            <p>layout:</p>
                            <p>os:</p>
                            <p>architecture:</p>
                        </div>
                        <div className="text-right">
                            <p>{browser}</p>
                            <p>{browserVersion}</p>
                            <p>{layout}</p>
                            <p>{os}</p>
                            <p>{osArchitecture}</p>
                        </div>
                        <div />
                    </div>
                    <div />
                </div>
            </div>
        </div>
    )
}

export const browsers = new Map([
    [
        'Firefox',
        {
            name: 'Firefox',
            displayName: 'Mozilla Firefox',
            logo: '/firefox.png'
        }
    ],
    [
        'Chrome',
        {
            name: 'Chrome',
            displayName: 'Google Chrome',
            logo: '/chrome.png'
        }
    ],
    [
        'chromium',
        {
            name: 'Chromium',
            displayName: 'Chromium',
            logo: 'chromium.png'
        }
    ],
    [
        'brave',
        {
            name: 'Brave',
            displayName: 'Brave',
            logo: '/brave.png'
        }
    ],
    [
        'edge',
        {
            name: 'Edge',
            displayName: 'Microsoft Edge',
            logo: '/edge.png'
        }
    ]
]);
/* v8 ignore stop*/
