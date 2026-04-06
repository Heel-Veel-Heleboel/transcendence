
import { JSX } from "react"
import { EntryContainer } from "../features/entry/LoginContainer.tsx"
import { FormContainer } from "../features/entry/FormContainer.tsx"
import { TwoFactorForm } from "../features/entry/TwoFactorForm.tsx"
import { useLocation } from "react-router-dom";

/* v8 ignore start */
export function TwoFactorLogin(): JSX.Element {
    const { state } = useLocation();

    return (
        <EntryContainer>
            <FormContainer>
                <TwoFactorForm email={state.email} password={state.password} />
            </FormContainer>
        </EntryContainer>
    )
}

/* v8 ignore stop */
