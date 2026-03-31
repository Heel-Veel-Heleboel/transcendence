import { BaseSyntheticEvent } from "react"
import { htmlIdefier } from "../../shared/utils/html"

export function SubmitPropertyChange({ handleChange, handleSubmit, buttonText }: { handleChange: (event: BaseSyntheticEvent) => void, handleSubmit: (event: BaseSyntheticEvent) => void, buttonText: string }) {
    return (
        <form onSubmit={handleSubmit} >
            <div >
                <div className="flex">
                    <input
                        className="border text-sm block w-full placeholder:text-body"
                        id={htmlIdefier(buttonText) + '-container'}
                        type="text"
                        onChange={handleChange}

                    />
                    <button className="text-sm border" type="submit">{buttonText}</button>
                </div>
            </div>
        </form>
    )
}

export function SubmitPropertyChangeOldNew(
    handleChangeOld: (event: BaseSyntheticEvent) => void,
    handleChangeNew: (event: BaseSyntheticEvent) => void,
    handleSubmit: (event: BaseSyntheticEvent) => void,
    buttonText: string,
) {

    return (
        <form onSubmit={handleSubmit} >
            <div >
                <div className="flex flex-col">
                    <input
                        className="border text-sm block w-full placeholder:text-body"
                        id="oldPropertyContainer"
                        type="text"
                        onChange={handleChangeOld}

                    />
                    <input
                        className="border text-sm block w-full placeholder:text-body"
                        id="newPropertyChange"
                        type="text"
                        onChange={handleChangeNew}

                    />
                    <button className="text-sm border" type="submit">{buttonText}</button>
                </div>
            </div>
        </form>
    )
}

export function SubmitPropertyChangeYesNo({ title, showDropdown, handleDropDown, yes, no }: { title: string, showDropdown: boolean, handleDropDown: () => void, yes: () => void, no: () => void }) {
    return (
        <div id={title.toLowerCase().replace(' ', '-')}>
            <div className="flex flex-col">
                <div className="w-full">
                    <button onClick={handleDropDown}>{title}</button>
                </div>
            </div>
            {
                showDropdown &&
                <div className="w-full border flex py-2">
                    <div className="w-2/5">
                        <span>Are you sure?: </span>
                    </div>
                    <div className="flex w-3/5">
                        <button className="border w-1/2" onClick={yes}>Yes</button>
                        <button className="border w-1/2" onClick={no}>No</button>
                    </div>
                </div>
            }
        </div>
    )
}
