import { JSX } from "react";
import { LoginContainer } from "../features/login/LoginContainer";
import { RegisterForm } from "../features/login/RegisterForm";
import { FormContainer } from "../features/login/FormContainer";

export function Register(): JSX.Element {
    return (
        <LoginContainer>
            <FormContainer>
                <RegisterForm />
            </FormContainer>
        </LoginContainer>
    )
}

/* v8 ignore stop */
