import { JSX } from "react/jsx-runtime"

export function DisplayedProfileProperty({ title, property, dropDown, toggleDropDown, showDropdown }: { title: string, property: string | undefined, dropDown: JSX.Element, toggleDropDown: () => void, showDropdown: boolean }): JSX.Element {
    return (
        <div id={title.toLowerCase().replace(' ', '-') + '-property'}>
            <div className="flex ">
                <div className="w-1/5 text-xl truncate">{title}</div>
                <div className="w-1/10">•</div>
                <div className="w-2/5 text-left truncate">{property}</div>
                <div className="w-1/10">•</div>
                <div className="w-1/5">
                    <button onClick={toggleDropDown}>{showDropdown ? "Cancel" : "Change"}</button>
                </div>
            </div>
            {showDropdown && dropDown}
        </div>
    )
}

export function HiddenProfileProperty({ title, dropDown, toggleDropDown, showDropdown }: { title: string, dropDown: JSX.Element, toggleDropDown: () => void, showDropdown: boolean }): JSX.Element {
    return (
        <div id={title.toLowerCase().replace(' ', '-') + '-property'}>;
            <div className="flex ">
                <div className="w-full text-xl truncate">
                    <button onClick={toggleDropDown}>{showDropdown ? "Cancel " + title : title}</button>
                </div>
            </div>
            {showDropdown && dropDown}
        </div>
    )
}
