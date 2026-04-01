import { JSX } from "react";
import { EntryContainer } from "../features/entry/LoginContainer";
import { RegisterForm } from "../features/entry/RegisterForm";
import { FormContainer } from "../features/entry/FormContainer";

export function Register(): JSX.Element {
    return (
        <EntryContainer>
            <FormContainer>
                <RegisterForm />
            </FormContainer>
        </EntryContainer>
    )
}

/* v8 ignore stop */
