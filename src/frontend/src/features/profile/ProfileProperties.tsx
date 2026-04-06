import { ReactNode, useEffect, useState } from "react"
import { useUserService } from "../../components/providers/User";
import { ProfileRelationships } from "./ProfileRelationships";
import { Username } from "./Username";
import { Email } from "./Email";
import { Password } from "./Password";
import { DeleteUser } from "./DeleteUser";
import { IUser } from "../../shared/types/user";
import { DEFAULT_USER } from "../../shared/constants/defaults";
import { TwoFactor } from "./TwoFactor";

export function ProfilePropertiesPrimary() {
    const userService = useUserService();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [user, setUser] = useState<IUser>(DEFAULT_USER);

    useEffect(() => {
        async function getUser() {
            try {
                const result = await userService.getUser();
                setUser(result.data);
            } catch (e: any) {
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        getUser();
    }, [])

    if (loading) {
        <ProfilePropertiesPrimaryContainer>
            <div>loading</div>
        </ProfilePropertiesPrimaryContainer>
    }
    if (error) {
        <ProfilePropertiesPrimaryContainer>
            <div>error</div>
        </ProfilePropertiesPrimaryContainer>
    }

    return (
        <ProfilePropertiesPrimaryContainer>
            <ProfileRelationships />
            <Username user={user} />
            <Email user={user} />
            <Password />
            <TwoFactor />
            <DeleteUser />
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
        <div id="secundary-profile-properties" className="flex min-h-1/4">
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
