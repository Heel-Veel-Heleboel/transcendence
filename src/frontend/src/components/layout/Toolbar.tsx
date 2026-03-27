import { JSX, useState, useEffect } from 'react';
import { useAuth } from '../providers/Auth.tsx';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../../shared/config/AppConfig.ts';

/* v8 ignore start*/
export function Toolbar(): JSX.Element {
    const time = localeDate();
    const navigate = useNavigate();
    const auth = useAuth();
    return (
        <div id="toolbar" className="h-1/20 w-full flex justify-between bg-gradient-to-r from-violet-800 from-10% via-orange-500 via-80% to-zinc-400 to-90%">
            {/* TODO update with own logo*/}
            <div className="px-2 py-2" onClick={() => navigate(CONFIG.MENU_NAVIGATION)}>logo</div>
            <div className="py-2">{`${time.date} - ${time.time}`}</div>
            <div id="toolbarOptionsContainer" className="flex ">
                <ToolbarOption id='profile' src={CONFIG.PROFILE_LOGO} callback={() => navigate(CONFIG.USER_PROFILE_NAVIGATION)} />
                <ToolbarOption id='logout' src={CONFIG.LOGOUT_LOGO} callback={() => auth.logOut()} />
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
    const locale = CONFIG.DEFAULT_LOCALE;
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
/* v8 ignore stop*/
