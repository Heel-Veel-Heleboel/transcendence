import { JSX } from "react"

export const Animation = (): JSX.Element => {
    return (
        <div>
            <h1>Animation</h1>
            <video autoPlay muted loop className="fixed -z-1" id="bgVideo">
                <source src="/bg.mp4" type="video/mp4" />
            </video>
        </div>
    )
}
