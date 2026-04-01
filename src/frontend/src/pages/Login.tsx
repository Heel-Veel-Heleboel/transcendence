import { JSX } from "react"
import { EntryContainer } from "../features/entry/LoginContainer.tsx"
import { LoginForm } from "../features/entry/LoginForm.tsx"
import { FormContainer } from "../features/entry/FormContainer.tsx"

/* v8 ignore start */
export function Login(): JSX.Element {
    return (
        <EntryContainer>
            <FormContainer>
                <LoginForm />
            </FormContainer>
        </EntryContainer>
    )
}

/* v8 ignore stop */
