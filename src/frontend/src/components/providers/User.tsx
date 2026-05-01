
import { createContext, ReactNode, useContext, } from 'react';
import { UserService } from '../../shared/api/user';
import { useAuth } from './Auth';
import { IUserService } from '../../shared/types/user';
import { FriendshipStatus, IBlockUser, ICancelRequest, ISetFriendshipStatus, responseToFriendship } from '../../shared/types/friendship';

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

    async function getProfile(userId: string) {
        try {
            const response = await service.getProfile({ userId: userId });
            return (response);
        } catch (e: any) {
            throw e
        }
    }

    async function getUser() {
        try {
            const response = await service.getUser({ userId: auth.userId });
            return (response);
        } catch (e: any) {
            throw e
        }
    }

    async function getUserByName(name: string) {
        try {
            const response = await service.getUserByName(name);
            return (response.data);
        } catch (e: any) {
            throw e
        }
    }

    async function getProfileAvatar(url: string) {
        try {
            const response = await service.getProfileAvatar({ avatarUrl: url });
            return (response);
        } catch (e: any) {
            throw e
        }
    }

    async function getFriendship(userId: string) {
        try {
            const response = await service.getFriendship({ userId1: auth.userId, userId2: userId });
            // Use current user's id as perspective so isRequester is correct
            return (responseToFriendship(response.data, Number(auth.userId)));
        } catch (e: any) {
            // 404 means no relationship exists yet — return null instead of throwing
            if (e?.response?.status === 404) {
                return null;
            }
            throw e
        }
    }

    async function setFriendship(addresseeId: string) {
        try {
            const response = await service.setFriendship({ requester_id: auth.userId, addressee_id: addresseeId });
            return (response);
        } catch (e: any) {
            throw e
        }
    }

    async function setFriendshipStatus(data: ISetFriendshipStatus) {
        try {
            if (!Object.values(FriendshipStatus).includes(data.status)) {
                throw new Error('invalid status given to service layer')
            }
            const response = await service.setFriendshipStatus(data);
            return (response);
        } catch (e: any) {
            throw e
        }
    }

    async function cancelFriendshipRequest(data: ICancelRequest) {
        try {
            const response = await service.cancelFriendshipRequest(data);
            return (response);
        } catch (e: any) {
            throw e
        }
    }

    async function blockUser(data: IBlockUser) {
        try {
            const response = await service.blockUser(data);
            return (response);
        } catch (e: any) {
            throw e
        }
    }

    async function unblockUser(data: IBlockUser) {
        try {
            const response = await service.unblockUser(data);
            return (response);
        } catch (e: any) {
            throw e
        }
    }

    async function setProfileAvatar(data: FormData) {
        try {
            const response = await service.setProfileAvatar({ userId: auth.userId, data });
            return (response);
        } catch (e: any) {
            throw e;
        }
    }

    async function setUsername(user_name: string) {
        try {
            const response = await service.setUsername({ user_id: auth.userId, user_name });
            return response
        } catch (e: any) {
            throw e;
        }
    }

    async function setEmail(user_email: string) {
        try {
            const response = await service.setEmail({ user_id: auth.userId, user_email });
            return response;
        } catch (e: any) {
            throw e;
        }
    }

    async function deleteUser() {
        try {
            const response = await service.deleteUser({ user_id: auth.userId });
            return response;
        } catch (e: any) {
            throw e;
        }
    }

    return (
        <UserServiceContext.Provider value={{
            getProfile,
            getUser,
            getUserByName,
            getProfileAvatar,
            getFriendship,
            setFriendship,
            setFriendshipStatus,
            cancelFriendshipRequest,
            blockUser,
            unblockUser,
            setProfileAvatar,
            setUsername,
            setEmail,
            deleteUser,
        }}>
            {children}
        </UserServiceContext.Provider >
    );
}
