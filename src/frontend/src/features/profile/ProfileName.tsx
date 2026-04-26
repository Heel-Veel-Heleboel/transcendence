export function ProfileName({ name }: { name: string }) {
    return (
        <div id="profile-name" className="h-1/6">
            @{name}
        </div>
    )
}
