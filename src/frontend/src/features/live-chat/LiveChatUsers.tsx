import { Dispatch, FormEvent, JSX, useState, SetStateAction, useEffect, ReactNode } from "react"
import { useUserService } from "../../components/providers/User";
import { useAuth } from "../../components/providers/Auth";
import { IUser } from "../../shared/types/user";
import { DEFAULT_USER } from "../../shared/constants/defaults";
import { VISITOR_PAGE_REDIRECTION } from "../../shared/constants/navigation";
import { useNavigate } from "react-router-dom";
import { FriendshipStatus, IFriendship } from "../../shared/types/friendship";
import { useChatService } from "../../components/providers/Chat";

export function LiveChatUsers({ setChannelId }: { setChannelId: Dispatch<SetStateAction<string>> }): JSX.Element {
    const [profile, setProfile] = useState<IUser>(DEFAULT_USER);

    return (
        <div className="min-h-full w-1/6 border border-black">
            <div className="border border-black border-t border-l border-r text-center">
                users
            </div>
            <UserSearchBar setProfile={setProfile} />
            <div className="grow">
                <UserSearchResult profile={profile} setChannelId={setChannelId} />
            </div>
        </div>
    )
}

export function UserSearchBar({ setProfile }: { setProfile: Dispatch<SetStateAction<IUser>> }) {
    const service = useUserService();
    const [content, setContent] = useState<string>('');

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const user = content.trim();

        if (user.indexOf(' ') >= 0) {
            alert('username must be one word, without space');
            return;
        }

        try {
            const result = await service.getUserByName(user);
            setProfile(result);
        } catch (e: any) {
            if (e.response.status === 404) {
                alert('no user found')
                return;
            }
            alert('failed to search for User');
            console.error(e);
        } finally {
            setContent('')
        }
    };

    return (
        <div id="user-search-form" className="min-h-1/10 p-2">
            <div className="min-h-full flex">
                <form className="min-h-full min-w-full flex" onSubmit={submit}>
                    <div className="min-w-4/5 min-h-full">
                        <textarea
                            id="user-search-input-element"
                            name="user-search-input"
                            className="border w-full min-h-full"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            rows={0}
                        />
                    </div>
                    <div id="user-search-send-button" className="min-w-1/5 min-h-full">
                        <button type="submit" className="border min-h-full w-full" >
                            <div className='flex justify-around'>
                                <img src="/search.png" alt="search-icon" className="h-1/2 w-1/2 invert p-2" />
                            </div>
                        </button>
                    </div>
                </form>
            </div>
        </div >
    )
}

export function UserSearchResult({ profile, setChannelId }: { profile: IUser, setChannelId: Dispatch<SetStateAction<string>> }) {
    const navigate = useNavigate();
    const [dropDown, setDropDown] = useState<boolean>(false);

    if (!profile.id) {
        return (
            <div id='empty-user-result'></div>
        );
    }

    function handleDropDown() {
        setDropDown(!dropDown);
    }

    return (
        <div id="user-search-container" className="p-2">
            <div id='user-result' className="flex">
                <div id='user-name-container' className="w-4/5 truncate">
                    <button onClick={() => navigate(VISITOR_PAGE_REDIRECTION(String(profile.id)))}>{profile.name}</button>
                </div>
                <div id="dropdown-button-container" className="w-1/5">
                    <button id="dropdown-button" onClick={() => handleDropDown()}>
                        <img src="/dropdown.png" alt="dropdown-button" className="h-1/2 w-1/2 invert" />
                    </button>

                </div>
            </div>
            {dropDown ?
                <UserDropDown profile={profile} setChannelId={setChannelId} /> :
                null
            }
        </div>
    )
}

export function UserDropDown({ profile, setChannelId }: { profile: IUser, setChannelId: Dispatch<SetStateAction<string>> }) {
    const navigate = useNavigate();
    const service = useUserService();
    const auth = useAuth();
    const [friendship, setFriendship] = useState<IFriendship | null>(null);

    async function loadFriendship() {
        try {
            const result = await service.getFriendship(String(profile.id));
            setFriendship(result);
        } catch (e: any) {
            console.error(e);
        }
    }

    useEffect(() => {
        loadFriendship();
    }, [profile.id]);

    const status = friendship?.status ?? FriendshipStatus.UNDEFINED;
    // Directional: only the one who initiated the block is the requester
    const iBlockedThem = friendship?.status === FriendshipStatus.BLOCKED && friendship.isRequester === true;

    return (
        <div id="user-dropdown" className="flex flex-col">
            <div>
                <button id="go-to-profile" onClick={() => navigate(VISITOR_PAGE_REDIRECTION(String(profile.id)))}>
                    show profile
                </button>
            </div>
            <UserDropDownContainer>
                {status === FriendshipStatus.UNDEFINED && <SendFriendshipRequest profile={profile} />}
                {status === FriendshipStatus.PENDING && <CancelFriendshipRequest profile={profile} />}
                {status === FriendshipStatus.ACCEPTED && <Unfriend profile={profile} />}
                {status === FriendshipStatus.REJECTED && <SendFriendshipRequest profile={profile} />}
                <SendMessage profile={profile} setChannelId={setChannelId} />
                {iBlockedThem
                    ? <UnBlockUser blocker_id={Number(auth.userId)} blocked_id={profile.id} onSuccess={loadFriendship} />
                    : <BlockUser blocker_id={Number(auth.userId)} blocked_id={profile.id} onSuccess={loadFriendship} />
                }
            </UserDropDownContainer>
        </div>
    )
}

export function UserDropDownContainer({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col">
            {children}
        </div>
    )

}

export function SendFriendshipRequest({ profile }: { profile: IUser }) {
    const service = useUserService();

    async function sendFriendship() {
        try {
            await service.setFriendship(String(profile.id))
        } catch (e: any) {
            console.error(e);
            alert('failed to send friendship request');
        }
    }

    return (
        <button id='send-friendship' onClick={() => sendFriendship()} className="text-left">
            send friendship
        </button>
    )
}

export function CancelFriendshipRequest({ profile }: { profile: IUser }) {
    const service = useUserService();

    async function cancelFriendshipRequest() {
        try {
            await service.setFriendshipStatus({ id: String(profile.id), status: FriendshipStatus.REJECTED });
        } catch (e: any) {
            console.error(e);
            alert('failed to cancel friendship request');
        }
    }

    return (
        <button id='cancel-friendship' onClick={() => cancelFriendshipRequest()} className="text-left">
            cancel friendship request
        </button>
    )
}

export function Unfriend({ profile }: { profile: IUser }) {
    const service = useUserService();

    async function unFriend() {
        try {
            await service.setFriendshipStatus({ id: String(profile.id), status: FriendshipStatus.REJECTED });
        } catch (e: any) {
            console.error(e);
            alert('failed to unfriend');
        }
    }

    return (
        <button id='unfriend' onClick={() => unFriend()} className="text-left">
            unfriend
        </button>
    )
}

export function BlockUser({ blocker_id, blocked_id, onSuccess }: { blocker_id: number, blocked_id: number, onSuccess: () => void }) {
    const service = useUserService();

    async function block() {
        try {
            await service.blockUser({ blocker_id, blocked_id });
            onSuccess();
        } catch (e: any) {
            console.error(e);
            alert('failed to block');
        }
    }

    return (
        <button id='block' onClick={() => block()} className="text-left">
            block
        </button>
    )
}

export function UnBlockUser({ blocker_id, blocked_id, onSuccess }: { blocker_id: number, blocked_id: number, onSuccess: () => void }) {
    const service = useUserService();

    async function unBlock() {
        try {
            await service.unblockUser({ blocker_id, blocked_id });
            onSuccess();
        } catch (e: any) {
            console.error(e);
            alert('failed to unblock');
        }
    }

    return (
        <button id='unblock' onClick={() => unBlock()} className="text-left">
            unblock
        </button>
    )
}


export function SendMessage({ profile, setChannelId }: { profile: IUser, setChannelId: Dispatch<SetStateAction<string>> }) {
    const service = useChatService();

    async function sendMessage() {
        try {
            const channel = await service.createOrGetDMChannel(profile.id);
            setChannelId(channel.id);
        } catch (e: any) {
            console.error(e);
            alert('failed to open chat');
        }
    }

    return (
        <button id='send-message' onClick={() => sendMessage()} className="text-left">
            send message
        </button>
    )

}
