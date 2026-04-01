import { JSX } from "react"
import { LoginContainer } from "../features/login/LoginContainer.tsx"
import { SignInForm } from "../features/login/SignInForm.tsx"
import { FormContainer } from "../features/login/FormContainer.tsx"

/* v8 ignore start */
export function SignIn(): JSX.Element {
    return (
        <LoginContainer>
            <FormContainer>
                <SignInForm />
            </FormContainer>

        </LoginContainer>
    )
}

/* v8 ignore stop */
