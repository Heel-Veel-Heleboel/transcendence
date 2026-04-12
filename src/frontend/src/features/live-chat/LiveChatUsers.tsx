import { JSX } from "react"
import { Terminal } from "../../components/layout/Terminal"

export function LiveChatUsers(): JSX.Element {
    // NOTE: Searchbar with empty content at first render
    // USERS search username and it displays search result
    // USER can click on dropdown menu which shows following options
    //      + show profile
    //      + friend
    //      + message
    //      + groupchat
    //      + block
    function UserContent(): JSX.Element {
        return (
            <div>user content</div>
        )
    }
    return (
        <div className="w-1/6 border border-black">
            <Terminal title={'Users'} >
                <UserContent />
            </Terminal>
        </div>
    )
}
