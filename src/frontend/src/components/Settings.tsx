import { JSX } from "react"

export function Settings(): JSX.Element {
    return (
        <div className="flex min-h-full min-w-full bg-purple-500/50 text-center">
            <div className="w-full flex flex-col justify-around text-xl">
                <div>
                    <div>language</div>
                    <div>color-scheme</div>
                    <div>background-animation</div>
                    <div>etc.</div>
                </div>
                <div></div>
            </div>
        </div>
    )
}
