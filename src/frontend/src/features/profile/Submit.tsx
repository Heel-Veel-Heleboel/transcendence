import { htmlIdefier } from "../../shared/utils/html"
import { IPropertyChange, IPropertyChangeOldNew, IPropertyChangeYesNo } from "../../shared/types/property"

export function SubmitPropertyChange({ props }: { props: IPropertyChange }) {
    return (
        <form onSubmit={props.handleSubmit} >
            <div >
                <div className="flex">
                    <input
                        className="border text-sm block w-full placeholder:text-body"
                        id={htmlIdefier(props.buttonText) + '-container'}
                        type="text"
                        onChange={props.handleChange}

                    />
                    <button className="text-sm border" type="submit">{props.buttonText}</button>
                </div>
            </div>
        </form>
    )
}

export function SubmitPropertyChangeOldNew({ props }: { props: IPropertyChangeOldNew }) {
    return (
        <form onSubmit={props.handleSubmit} >
            <div >
                <div className="flex flex-col">
                    <input
                        className="border text-sm block w-full placeholder:text-body"
                        id="old-property-container"
                        type="text"
                        onChange={props.handleChangeOld}

                    />
                    <input
                        className="border text-sm block w-full placeholder:text-body"
                        id="new-property-container"
                        type="text"
                        onChange={props.handleChangeNew}

                    />
                    <button className="text-sm border" type="submit">{props.buttonText}</button>
                </div>
            </div>
        </form>
    )
}

export function SubmitPropertyChangeYesNo({ props }: { props: IPropertyChangeYesNo }) {
    return (
        <div id={props.title.toLowerCase().replace(' ', '-')}>
            <div className="flex flex-col">
                <div className="w-full">
                    <button onClick={props.handleDropDown}>{props.title}</button>
                </div>
            </div>
            {
                props.showDropdown &&
                <div className="w-full border flex py-2">
                    <div className="w-2/5">
                        <span>Are you sure?: </span>
                    </div>
                    <div className="flex w-3/5">
                        <button className="border w-1/2" onClick={props.yes}>Yes</button>
                        <button className="border w-1/2" onClick={props.no}>No</button>
                    </div>
                </div>
            }
        </div>
    )
}
