import { createContext, ReactNode, useContext, } from 'react';
import { IAck, IChatMessage, IChatService } from '../../shared/types/chat';
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
            const mappedChannels = response.data.map((channel: IChatMessage) => channel.id); // INFO: mapping necessary for proper list rendering
            return (mappedChannels);
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
    return (
        <ChatServiceContext.Provider value={{
            getChannels,
            getChannelMessages,
            setAck,
        }}>
            {children}
        </ChatServiceContext.Provider >
    );
}
