import { JSX } from "react"
import { LoginContainer } from "../features/login/LoginContainer.tsx"
import { CreditsContainer } from "../features/login/Credits.tsx"

/* v8 ignore start */
export function Credits(): JSX.Element {
    return (
        <LoginContainer>
            <CreditsContainer />

        </LoginContainer>
    )
}

/* v8 ignore stop */
