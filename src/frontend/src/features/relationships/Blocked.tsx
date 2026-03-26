import { Terminal } from "../../components/utils/MenuUtils";
import { RelationsColumn } from "./RelationsColumn";

export function Blocked() {

    return (
        <RelationsColumn>
            <Terminal title={'blocked'} child={(<div>lol</div>)} />
        </RelationsColumn>
    )
}
