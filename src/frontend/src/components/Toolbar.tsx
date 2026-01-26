import { JSX, useState, useEffect } from 'react';
import { MENU_PAGE } from '../constants/Constants.ts'
import { useNavigate } from 'react-router-dom';

export function Toolbar({ redirect }: { redirect: (page: number) => void }): JSX.Element {
    const time = localeDate();
    const navigate = useNavigate();
    return (
        <div id="toolbar" className="w-full flex justify-between bg-gradient-to-r from-violet-800 from-10% via-orange-500 via-80% to-zinc-400 to-90%">
            {/* TODO update with own logo*/}
            <div className="px-2 py-2" onClick={() => redirect(MENU_PAGE.MENU)}>logo</div>
            <div className="py-2">{`${time.date} - ${time.time}`}</div>
            <div id="toolbarOptionsContainer" className="w-35 flex ">
                <ToolbarOption id='profile' src='profile.png' callback={() => redirect(MENU_PAGE.PROFILE)} />
                <ToolbarOption id='settings' src='settings.png' callback={() => redirect(MENU_PAGE.SETTINGS)} />
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
    const [today, setDate] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setDate(new Date());
        }, 1 * 1000);
        return () => {
            clearInterval(timer);
        }
    }, []);

    const date = today.toLocaleDateString(locale, { year: '2-digit', month: 'numeric', day: 'numeric' });
    const time = today.toLocaleTimeString(locale, { hour: 'numeric', minute: 'numeric' });

    return {
        date,
        time
    };
};
