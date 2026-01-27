import { JSX } from 'react';
import platform from 'platform';
import { browsers } from "../utils/browserLogos";

/* v8 ignore start*/
export function TrinityFetch(): JSX.Element {
    // TODO add user@alias above info
    const browser = (platform.name === null) ? '?' : platform.name;
    const browserVersion = (platform.version === null) ? '?' : platform.version;
    const layout = (platform.layout === null) ? '?' : platform.layout;
    const os = (platform.os?.family === null) ? '?' : platform.os?.family;
    const osArchitecture = (platform.os?.architecture === null) ? '?' : platform.os?.architecture;
    const product = (platform.product === null) ? '?' : platform.product;
    const manufacturer = (platform.manufacturer === null) ? '?' : platform.manufacturer;
    // TODO update with p5 version
    const logo = (platform.name === undefined) ? '?' : (browsers.get(platform.name)?.logo);
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
/* v8 ignore stop*/
