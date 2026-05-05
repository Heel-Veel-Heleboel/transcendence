import { JSX } from "react/jsx-runtime"
import { htmlIdefier } from "../../shared/utils/html"
import { ReactNode } from "react"

export function DisplayedProfileProperty({ title, property, toggleDropDown, showDropdown, children }: { title: string, property: string | undefined, toggleDropDown: () => void, showDropdown: boolean, children: ReactNode }): JSX.Element {
    return (
        <div id={htmlIdefier(title) + '-property'}>
            <div className="flex">
                <div className="w-1/5 text-xl truncate">{title}</div>
                <div className="w-1/10">•</div>
                <div className="w-2/5 text-left truncate">{property}</div>
                <div className="w-1/10">•</div>
                <div className="w-1/5">
                    <button onClick={toggleDropDown} className="hover:underline">{showDropdown ? "Cancel" : "Change"}</button>
                </div>
            </div>
            {showDropdown && children}
        </div>
    )
}

export function HiddenProfileProperty({ title, toggleDropDown, showDropdown, children }: { title: string, toggleDropDown: () => void, showDropdown: boolean, children: ReactNode }): JSX.Element {
    return (
        <div id={htmlIdefier(title) + '-property'}>
            <div className="flex">
                <div className="w-full text-xl truncate">
                    <button onClick={toggleDropDown} className="hover:underline">{showDropdown ? "Cancel " + title : title}</button>
                </div>
            </div>
            {showDropdown && children}
        </div>
    )
}
