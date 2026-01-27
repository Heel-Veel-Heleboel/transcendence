import { Route, Routes, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react';
import { Game, StartMenu, Menu } from '../pages'

/* v8 ignore start */
export const Router = () => {
    const [hydrated, setHydrated] = useState(false);
    const location = useLocation();
    const currentLocation = location.pathname.split("/")[1];
    useEffect(() => {
        setHydrated(true);
        let name;
        if (currentLocation[0] === undefined) {
            name = 'Start Menu';
        } else {
            name = `${currentLocation[0].toUpperCase()}${currentLocation.slice(1,)}`
        }
        document.title = `Transcendance | ${name}`
    }, [])

    if (!hydrated) {
        return null;
    }
    return (
        <Routes>
            <Route path="/" element={<StartMenu />} />
            <Route path="/game" element={<Game />} />
            <Route path="/menu" element={<Menu />} />
        </Routes>
    )
}
/* v8 ignore stop */
