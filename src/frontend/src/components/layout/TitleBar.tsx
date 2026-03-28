import { JSX } from "react"
import { CONFIG } from "../../shared/config/AppConfig"

export function TitleBar({ logoPath, title }: { logoPath: string, title: string }): JSX.Element {
    return (
        <div className="h-1/10 border-1 border-black bg-pink-800 flex justify-between px-1">
            <div className="w-5 py-1">
                <img src={logoPath} alt='logo' />
            </div>
            <div>{title}</div>
            <div className='w-20 flex'>
                <div className="px-2 py-2">
                    <img src={CONFIG.MINIMIZE_LOGO} alt={CONFIG.MINIMIZE_ALT} />
                </div>
                <div className="px-2 py-2">
                    <img src={CONFIG.MAXIMIZE_LOGO} alt={CONFIG.MAXIMIZE_ALT} />
                </div>
                <div className="px-2 py-2">
                    <img src={CONFIG.CLOSE_LOGO} alt={CONFIG.CLOSE_ALT} />
                </div>
            </div >
        </div>
    )
}
