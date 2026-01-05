import { Route, Routes } from 'react-router-dom'

import { Game, Login, Menu } from '../pages'

export const Router = () => {
    return (
        <Routes>
            <Route index path="/" element={<Login />} />
            <Route index path="/menu" element={<Menu />} />
            <Route index path="/game" element={<Game />} />
        </Routes>
    )
}
