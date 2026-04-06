import { JSX } from "react";

export function Animation(): JSX.Element {
    return (
        <video autoPlay muted loop className="fixed right-0 bottom-0 min-w-full min-h-full -z-1 object-cover" id="bgVideo">
            {/*TODO: Change with p5 animation*/}
            <source src="/bg.mp4" type="video/mp4" />
        </video>
    )
}
