import { BaseSyntheticEvent } from "react"

export function SubmitPropertyChange(handleChange: (event: BaseSyntheticEvent) => void, handleSubmit: (event: BaseSyntheticEvent) => void, buttonText: string) {
    return (
        <form onSubmit={handleSubmit} >
            <div >
                <div className="flex">
                    <input
                        className="border text-sm block w-full placeholder:text-body"
                        id={buttonText.replace(/\s/g, "") + 'Container'}
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
