import { JSX } from "react";

export function Title(): JSX.Element {
    return (
        <h1 id='title' className="text-8xl flex font-monof justify-center">
            <div>
                <p className="text-metalgear">Counter</p>
                <p className="text-solidsnake">'</p>
                <p className="text-liquidsnake">Pong</p>
            </div>
        </h1>)
}
