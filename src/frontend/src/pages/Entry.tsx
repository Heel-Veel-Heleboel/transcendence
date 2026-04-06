import { JSX } from "react"
import { EntryContainer } from "../features/entry/LoginContainer.tsx"
import { EntryMenu } from "../features/entry/Entry.tsx"

/* v8 ignore start */
export function Entry(): JSX.Element {
    return (
        <EntryContainer>
            <EntryMenu />
        </EntryContainer>
    )
}

/* v8 ignore stop */
