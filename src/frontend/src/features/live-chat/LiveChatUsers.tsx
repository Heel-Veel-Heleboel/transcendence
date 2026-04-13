import { Dispatch, FormEvent, JSX, useState, SetStateAction } from "react"
import { useUserService } from "../../components/providers/User";
import { IUser } from "../../shared/types/user";
import { DEFAULT_USER } from "../../shared/constants/defaults";
import { VISITOR_NAVIGATION, VISITOR_PAGE_REDIRECTION } from "../../shared/constants/navigation";
import { useNavigate } from "react-router-dom";

// NOTE: Searchbar with empty content at first render
// USERS search username and it displays search result
// USER can click on dropdown menu which shows following options
//      + show profile
//      + friend
//      + message
//      + groupchat
//      + block

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
                <div>lol</div> :
                null
            }
        </div>
    )
}
