
export function ProfilePictureImage({ image }: { image: string }) {
    return (
        <div className="flex justify-between">
            <div />
            <img src={image} alt="profile_pic" className="w-1/4 min-h-1/2" />
            <div />
        </div>
    )

}
