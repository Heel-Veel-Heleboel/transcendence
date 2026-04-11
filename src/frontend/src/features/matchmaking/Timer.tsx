import { JSX } from "react";
import * as timer from 'react-timer-hook';

export function Timer({ expiryTimestamp }: { expiryTimestamp: Date }): JSX.Element {
    const {
        seconds,
        minutes,
    } = timer.useTimer({ expiryTimestamp, onExpire: () => console.warn('onExpire called') });

    return (
        <div >
            {minutes}:{seconds}
        </div>
    )

}
