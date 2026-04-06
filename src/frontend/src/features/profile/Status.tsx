export function Status({ status }: { status: string | undefined }) {
    return (
        <div id="StatusContainer">
            {status === 'ONLINE' ? '🟢' : '🔴'} {status?.toLowerCase()}
        </div>

    )
}
