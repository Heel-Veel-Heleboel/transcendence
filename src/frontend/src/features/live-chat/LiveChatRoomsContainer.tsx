import { ReactNode } from "react";
import { Terminal } from "../../components/layout/Terminal";

export function LiveChatRoomsContainer({ children }: { children: ReactNode }) {

    return (
        <div className="w-1/6 border">
            <Terminal title={'Rooms'} >
                {children}
            </Terminal>
        </div>
    )
}
