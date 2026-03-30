
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { UserService } from '../../shared/api/user';
import { useAuth } from './Auth';
import { IUserService } from '../../shared/types/user';

const instance = new UserService();
const defaultUserService = {
    getUser: () => instance.getUser('0'),
    getProfile: () => instance.getProfile('0')
}


const UserServiceContext = createContext<IUserService>(
    defaultUserService
);

export function useUserService() { return useContext(UserServiceContext); }

export function UserProvider({ children }: { children: ReactNode }) {
    const [userService, setUserService] = useState<IUserService>(defaultUserService)
    const auth = useAuth();

    useEffect(() => {
        setUserService(
            {
                getUser: () => instance.getUser(auth.userId),
                getProfile: () => instance.getUser(auth.userId)
            }
        )
    }, [auth.userId])

    return (
        <UserServiceContext.Provider value={userService}>
            {children}
        </UserServiceContext.Provider>
    );
}
