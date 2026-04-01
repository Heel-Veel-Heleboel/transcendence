import { ReactNode, useEffect, useState } from "react"
import { useUserService } from "../../components/providers/User";
import useAxios from "axios-hooks";
import { ProfileRelationships } from "./ProfileRelationships";
import { Username } from "./Username";
import { Email } from "./Email";
import { Password } from "./Password";
import { DeleteAccount } from "./DeleteAccount";
import { IUser } from "../../shared/types/user";
import { DEFAULT_USER } from "../../shared/constants/defaults";

export function ProfilePropertiesPrimary() {
    const userService = useUserService();
    const [userResult] = useAxios(userService.getUser());
    const [user, setUser] = useState<IUser>(DEFAULT_USER);

    useEffect(() => {
        if (userResult.data) {
            setUser(userResult.data)
        }
    }, [userResult])

    if (userResult.loading) {
        <ProfilePropertiesPrimaryContainer>
            <div>loading</div>
        </ProfilePropertiesPrimaryContainer>
    }
    if (userResult.error) {
        <ProfilePropertiesPrimaryContainer>
            <div>error</div>
        </ProfilePropertiesPrimaryContainer>
    }

    return (
        <ProfilePropertiesPrimaryContainer>
            <ProfileRelationships />
            <Username user={user} />
            <Email user={user} />
            <Password user={user} />
            <DeleteAccount user={user} />
        </ProfilePropertiesPrimaryContainer>
    )
}

export function ProfilePropertiesPrimaryContainer({ children }: { children: ReactNode }) {
    return (
        <div id="primary-profile-properties" className="flex justify-around min-h-1/2">
            <div />
            <div className="text-left w-3/5 flex flex-col justify-between min-h-full">
                <div />
                <div className="flex flex-col justify-around min-h-3/5">
                    {children}
                </div>
                <div />
            </div>
            <div />
        </div>
    )
}

export function ProfilePropertiesSecundary({ children }: { children: ReactNode }) {
    return (
        <div id="secundary-profile-properties" className="flex min-h-1/2">
            {children}
        </div>

    )
}

export function ProfileProperties({ children }: { children: ReactNode }) {
    return (
        <div id='profile-properties' className="w-1/2 min-h-full flex flex-col text-xl">
            {children}
        </div>
    )

}
