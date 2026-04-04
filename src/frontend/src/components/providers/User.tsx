
import { createContext, ReactNode, useContext, } from 'react';
import { UserService } from '../../shared/api/user';
import { useAuth } from './Auth';
import { IUserService } from '../../shared/types/user';
import { UseAxios } from 'axios-hooks';
import { AxiosRequestConfig } from 'axios';

const instance = new UserService();

const UserServiceContext = createContext<IUserService>(
    {
        getProfile: () => { return null },
        getUser: () => () => { return null },
        getProfileAvatar: (url: string) => { return null },
        postProfileAvatar: () => () => { return null },
        patchUsername: async () => { return },
        patchEmail: async () => { return },
        deleteUser: async () => { return },
    }
);

export function useUserService() { return useContext(UserServiceContext); }

export function UserProvider({ useAxios, children }: { useAxios: UseAxios, children: ReactNode }) {
    const auth = useAuth();
    const [, exePostProfileAvatar] = useAxios(instance.postProfileAvatar(auth.userId), { manual: true });
    const [, exePatchUsername] = useAxios(instance.patchUsername(), { manual: true });
    const [, exePatchEmail] = useAxios(instance.patchEmail(), { manual: true });
    const [, exeDeleteUser] = useAxios(instance.deleteUser(), { manual: true });

    function getProfile() {
        const result = useAxios(instance.getProfile(auth.userId));
        return (result);
    }


    function getUser() {
        const result = useAxios(instance.getUser(auth.userId));
        return (result);
    }

    function getProfileAvatar(url: string) {
        const result = useAxios(instance.getProfileAvatar(url));
        return (result);
    }

    async function postProfileAvatar(config: AxiosRequestConfig) {
        try {
            await exePostProfileAvatar(config);
        } catch (e: any) {
            console.error(e);
            // TODO: add error handling
            // throw e;
        }
    }

    async function patchUsername(config: AxiosRequestConfig) {
        try {
            await exePatchUsername(config);
        } catch (e: any) {
            console.error(e);
            // TODO: add error handling
            // throw e;
        }
    }

    async function patchEmail(config: AxiosRequestConfig) {
        try {
            await exePatchEmail(config);
        } catch (e: any) {
            console.error(e);
            // TODO: add error handling
            // throw e;
        }
    }

    async function deleteUser(config: AxiosRequestConfig) {
        try {
            await exeDeleteUser(config);
        } catch (e: any) {
            console.error(e);
            // TODO: add error handling
            // throw e;
        }
    }

    return (
        <UserServiceContext.Provider value={{
            getProfile,
            getUser,
            getProfileAvatar,
            postProfileAvatar,
            patchUsername,
            patchEmail,
            deleteUser,
        }}>
            {children}
        </UserServiceContext.Provider >
    );
}
