import { JSX, useState, useEffect } from "react";
import { IAudioMetadata, IPicture, parseWebStream, selectCover } from 'music-metadata';

/* v8 ignore start */
export function Mtvx(): JSX.Element {
    const [metaData, setMetaData] = useState<IAudioMetadata | null>(null);
    const [cover, setCover] = useState<IPicture | null>(null);
    const [mp3, setMp3] = useState<string | undefined>('60681z.mp3');
    setMp3('60681z.mp3')
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
        const img = document.getElementById('cover-art') as HTMLImageElement;
        const coverBuffer = [cover?.data] as unknown as Uint8Array<ArrayBuffer>
        if (coverBuffer) {

            img.src = URL.createObjectURL(
                new Blob([coverBuffer], { type: 'image/jpg' } /* (1) */)
            );
        }
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

        if (response.body) {
            const contentType = response.headers.get('Content-Type');
            if (contentType) {
                metadata = await parseWebStream(response.body, {
                    mimeType: contentType,
                    size
                });

            }
        } else {
            throw Error('no valid response');
        }
    } catch (error: any) {
        console.error('Error parsing metadata:', error.message);
    }
    return metadata;
}
/* v8 ignore stop */
