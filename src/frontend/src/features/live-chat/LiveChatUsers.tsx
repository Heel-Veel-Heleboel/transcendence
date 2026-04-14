import { Dispatch, FormEvent, JSX, useState, SetStateAction, useEffect, ReactNode } from "react"
import { useUserService } from "../../components/providers/User";
import { IUser } from "../../shared/types/user";
import { DEFAULT_FRIENDSHIP, DEFAULT_USER } from "../../shared/constants/defaults";
import { VISITOR_PAGE_REDIRECTION } from "../../shared/constants/navigation";
import { useNavigate } from "react-router-dom";
import { FriendshipStatus, IFriendship } from "../../shared/types/friendship";
import { useChatService } from "../../components/providers/Chat";

export function LiveChatUsers(): JSX.Element {
    const [profile, setProfile] = useState<IUser>(DEFAULT_USER);

    return (
        <div className="min-h-full w-1/6 border border-black">
            <div className="border border-black border-t border-l border-r text-center">
                users
            </div>
            <UserSearchBar setProfile={setProfile} />
            <div className="grow">
                <UserSearchResult profile={profile} />
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

export function UserSearchResult({ profile }: { profile: IUser }) {
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
                <UserDropDown profile={profile} /> :
                null
            }
        </div>
    )
}

export function UserDropDown({ profile }: { profile: IUser }) {
    const navigate = useNavigate();
    const service = useUserService();
    const [friendship, setFriendship] = useState<IFriendship>(DEFAULT_FRIENDSHIP);

    useEffect(() => {
        async function getFriendship() {
            try {
                service.getFriendship(String(profile.id))
                setFriendship(friendship);
            } catch (e: any) {
                console.error(e);
            }
        }

        getFriendship()
    }, [])

    return (
        <div id="user-dropdown" className="flex flex-col">
            <div>
                <button id="go-to-profile" onClick={() => navigate(VISITOR_PAGE_REDIRECTION(String(profile.id)))}>
                    show profile
                </button>
            </div>
            {friendship.status === FriendshipStatus.UNDEFINED ?
                <UserDropDownContainer>
                    <SendFriendshipRequest profile={profile} />
                    <SendMessage />
                    <BlockUser profile={profile} />
                </UserDropDownContainer>
                : null
            }
            {friendship.status === FriendshipStatus.PENDING ?
                <UserDropDownContainer>
                    <CancelFriendshipRequest profile={profile} />
                    <SendMessage />
                    <BlockUser profile={profile} />
                </UserDropDownContainer>
                : null
            }
            {friendship.status === FriendshipStatus.ACCEPTED ?
                <UserDropDownContainer>
                    <Unfriend profile={profile} />
                    <SendMessage />
                    <BlockUser profile={profile} />
                </UserDropDownContainer>
                : null
            }
            {friendship.status === FriendshipStatus.REJECTED ?
                <UserDropDownContainer>
                    <SendFriendshipRequest profile={profile} />
                    <SendMessage />
                    <BlockUser profile={profile} />
                </UserDropDownContainer>
                : null
            }
            {friendship.status === FriendshipStatus.BLOCKED ?
                <UserDropDownContainer>
                    <SendFriendshipRequest profile={profile} />
                    <SendMessage />
                    <UnBlockUser profile={profile} />
                </UserDropDownContainer>
                : null
            }
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

export function BlockUser({ profile }: { profile: IUser }) {
    const service = useUserService();

    async function block() {
        try {
            await service.setFriendshipStatus({ id: String(profile.id), status: FriendshipStatus.BLOCKED });
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

export function UnBlockUser({ profile }: { profile: IUser }) {
    const service = useUserService();

    async function unBlock() {
        try {
            await service.setFriendshipStatus({ id: String(profile.id), status: FriendshipStatus.PENDING });
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


export function SendMessage() {
    const service = useChatService();

    async function sendMessage() {
        try {
            // await service.getChannelBetween({ id: String(profile.id), status: FriendshipStatus.PENDING });
        } catch (e: any) {
            console.error(e);
            alert('failed to unblock');
        }
    }

    return (
        <button id='send-message' onClick={() => sendMessage()} className="text-left">
            send message
        </button>
    )

}
