import { JSX } from "react"
import { Animation } from "../../components/login/animation/Animation"
import { Title } from "../../components/login/title/Title"
import { Logo } from "../../components/login/logo/Logo"
import { MenuOption } from "../../components/login/menuOption/MenuOption"

export const Login = (): JSX.Element => {
    return (
        <div className="h-full">
            <h1>Login</h1>
            <Animation />
            <div className="startMenu">
                <Title />
                <Logo />
                <div className="menuOptions">

                    <MenuOption />
                    <MenuOption />
                </div>
            </div>

        </div>
    )
}
