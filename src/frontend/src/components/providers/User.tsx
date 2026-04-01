
import { createContext, ReactNode, useContext, } from 'react';
import { UserService } from '../../shared/api/user';
import { useAuth } from './Auth';
import { IUserService } from '../../shared/types/user';
import { UseAxios } from 'axios-hooks';

const instance = new UserService();

const UserServiceContext = createContext<IUserService>(
    {
        getProfile: () => { return null },
        getUser: () => () => { return null },
        getProfileAvatar: (url: string) => { return null },
        postProfileAvatar: () => () => { return null },
        patchUsername: () => () => { return null },
        patchEmail: () => () => { return null },
        deleteUser: () => () => { return null },
    }
);

export function useUserService() { return useContext(UserServiceContext); }

export function UserProvider({ useAxios, children }: { useAxios: UseAxios, children: ReactNode }) {
    const auth = useAuth();

    function getProfile() {
        const result = useAxios(instance.getProfile(auth.userId));
        return (result);
    }

    return (
        <UserServiceContext.Provider value={{
            getProfile,
            getUser: () => instance.getUser(auth.userId),
            getProfileAvatar: (url: string) => instance.getProfileAvatar(url),
            postProfileAvatar: () => instance.postProfileAvatar(auth.userId),
            patchUsername: () => instance.patchUsername(),
            patchEmail: () => instance.patchEmail(),
            deleteUser: () => instance.deleteUser(),
        }}>
            {children}
        </UserServiceContext.Provider >
    );
}
