import { JSX, useState, useEffect } from 'react';
import { useAuth } from '../providers/Auth.tsx';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../../shared/config/AppConfig.ts';
import { htmlIdefier } from '../../shared/utils/html.ts';

/* v8 ignore start*/
export function Toolbar(): JSX.Element {
    const time = localeDate();
    const navigate = useNavigate();
    const auth = useAuth();
    return (
        <div id="toolbar" className="h-1/30 w-full flex justify-between bg-gradient-to-r from-violet-800 from-10% via-orange-500 via-80% to-zinc-400 to-90%">
            <div id='toolbar-home-options' className='flex'>
                <ToolbarOption id='home' src='/home.png' callback={() => navigate(CONFIG.MENU_NAVIGATION)} />
            </div>
            <div className="py-2">{`${time.date} - ${time.time}`}</div>
            <div id="toolbar-options" className="flex">
                <ToolbarOption id='profile' src={CONFIG.PROFILE_LOGO} callback={() => navigate(CONFIG.USER_PROFILE_NAVIGATION)} />
                <ToolbarOption id='logout' src={CONFIG.LOGOUT_LOGO} callback={() => auth.logOut()} />
            </div>
        </div>
    )
}

export function ToolbarOption({ id, src, callback }: { id: string, src: string, callback: () => void }): JSX.Element {
    return (
        <div id={`toolbar-option-${htmlIdefier(id)}`} className='flex px-2 py-1'>
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
