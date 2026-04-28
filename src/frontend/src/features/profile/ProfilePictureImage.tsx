
export function ProfilePictureImage({ image }: { image: string }) {
    return (
        <div id='profile-picture-container' className="flex justify-between min-h-1/2 max-h-1/2">
            <div />
            <div className="w-1/4 min-h-full bg-zinc-600/50 border">
                <img src={image} alt="profile_pic" className="w-full h-full" />
            </div>
            <div />
        </div>
    )

}
