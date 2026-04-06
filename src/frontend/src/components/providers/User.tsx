
import { createContext, ReactNode, useContext, } from 'react';
import { UserService } from '../../shared/api/user';
import { useAuth } from './Auth';
import { IUserService } from '../../shared/types/user';

const service = new UserService();

const UserServiceContext = createContext<IUserService | undefined>(undefined);

export function useUserService() {
    const userContext = useContext(UserServiceContext);
    if (userContext === undefined) {
        throw new Error('useUserService has to be used within UserProvide');
    }
    return userContext;
}

export function UserProvider({ children }: { children: ReactNode }) {
    const auth = useAuth();

    async function getProfile() {
        try {
            const response = service.getProfile({ userId: auth.userId });
            return (response);
        } catch (e: any) {
            console.error(e);
            throw e
        }
    }

    async function getUser() {
        try {
            const response = service.getUser({ userId: auth.userId });
            return (response);
        } catch (e: any) {
            console.error(e);
            throw e
        }
    }

    async function getProfileAvatar(url: string) {
        try {
            const response = service.getProfileAvatar({ avatarUrl: url });
            return (response);
        } catch (e: any) {
            console.error(e);
            throw e
        }
    }

    async function setProfileAvatar(data: FormData) {
        try {
            const response = await service.setProfileAvatar({ userId: auth.userId, data });
            return (response);
        } catch (e: any) {
            console.error(e);
            // TODO: add error handling
            throw e;
        }
    }

    async function setUsername(user_name: string) {
        try {
            const response = await service.setUsername({ user_id: auth.userId, user_name });
            return response
        } catch (e: any) {
            console.error(e);
            // TODO: add error handling
            throw e;
        }
    }

    async function setEmail(user_email: string) {
        try {
            const response = await service.setEmail({ user_id: auth.userId, user_email });
            return response;
        } catch (e: any) {
            console.error(e);
            // TODO: add error handling
            throw e;
        }
    }

    async function deleteUser() {
        try {
            const response = await service.deleteUser({ user_id: auth.userId });
            return response;
        } catch (e: any) {
            console.error(e);
            // TODO: add error handling
            throw e;
        }
    }

    return (
        <UserServiceContext.Provider value={{
            getProfile,
            getUser,
            getProfileAvatar,
            setProfileAvatar,
            setUsername,
            setEmail,
            deleteUser,
        }}>
            {children}
        </UserServiceContext.Provider >
    );
}
