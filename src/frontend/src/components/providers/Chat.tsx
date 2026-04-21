import { createContext, ReactNode, useContext, } from 'react';
import { IAck, IMessage, IChatService, IChat } from '../../shared/types/chat';
import { ChatService } from '../../shared/api/chat';

const service = new ChatService();

const ChatServiceContext = createContext<IChatService | undefined>(undefined);

export function useChatService() {
    const userContext = useContext(ChatServiceContext);
    if (userContext === undefined) {
        throw new Error('useChatService has to be used within ChatProvider');
    }
    return userContext;
}

export function ChatProvider({ children }: { children: ReactNode }) {

    async function getChannels() {
        try {
            const response = await service.getChannels();
            return (response.data);
        } catch (e: any) {
            console.error(e);
            // TODO: add error handling
            throw e
        }
    }

    async function getChannelMessages(channelId: string) {
        try {
            const response = await service.getChannelMessages(channelId);
            return (response.data);
        } catch (e: any) {
            console.error(e);
            // TODO: add error handling
            throw e
        }
    }

    async function setAck(data: IAck) {
        try {
            await service.setAck(data);
        } catch (e: any) {
            console.error(e);
            // TODO: add error handling
            throw e
        }
    }

    async function sendMessage(data: IMessage) {
        try {
            return await service.sendMessage(data);
        } catch (e: any) {
            console.error(e);
            // TODO: add error handling
            throw e
        }
    }

    async function createOrGetDMChannel(targetUserId: number): Promise<IChat> {
        try {
            return await service.createOrGetDMChannel(targetUserId);
        } catch (e: any) {
            console.error(e);
            throw e
        }
    }

    async function markChannelRead(channelId: string): Promise<IChat> {
        try {
            return await service.markChannelRead(channelId);
        } catch (e: any) {
            console.error(e);
            throw e
        }
    }

    return (
        <ChatServiceContext.Provider value={{
            getChannels,
            getChannelMessages,
            setAck,
            sendMessage,
            createOrGetDMChannel,
            markChannelRead
        }}>
            {children}
        </ChatServiceContext.Provider >
    );
}
