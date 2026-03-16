import { BaseSyntheticEvent, JSX, useEffect, useState } from "react"
import api from "../api";
import { CONFIG } from "../constants/AppConfig";
import { getCookie } from "../components/utils/cookies";
import { ERRORS } from "../constants/Errors";
import { MainContainer } from "../components/sections/MainContainer";
import { Widget } from "../components/utils/MenuUtils";
import { useParams } from "react-router-dom";
import { IProfile, IUser } from "../types/profile";

/* v8 ignore start */


export function Profile(): JSX.Element {
    return (
        <MainContainer children={
            <Widget logoPath={CONFIG.PROFILE_LOGO} title={CONFIG.PROFILE_TITLE} width="w-full" child={<UserProfileContent />} />
        } />
    )
}

export function VisitorProfile(): JSX.Element {
    const { userId } = useParams();
    if (typeof userId === 'undefined') {
        return <div>error</div>
    }
    return (
        <MainContainer children={
            <Widget logoPath={CONFIG.PROFILE_LOGO} title={CONFIG.PROFILE_TITLE} width="w-full" child={<VisitorProfileContent userId={userId} />} />
        } />
    )
}

export function VisitorProfileContent({ userId }: { userId: string }): JSX.Element {
    const [username, setUsername] = useState<string>();
    const [email, setEmail] = useState<string>();

    useEffect(() => {
        async function getUser() {
            try {
                const user = await api<IUser>({
                    url: CONFIG.REQUEST_USER + userId
                })
                setUsername(user.data.name);
                setEmail(user.data.email);
            }
            catch (e: any) {
                console.error(e);
                throw new Error(ERRORS.PROFILE_USER_FAILED);
            }
        }

        getUser()
    }, [])

    return (
        <div id='avatar' className="flex min-w-full min-h-full bg-emerald-500/50 text-center">
            <div className="w-1/2 min-h-full flex flex-col justify-around text-xl">
                <div>
                    <div>{username}</div>
                    <div className=" flex justify-center">
                        {/*TODO: Change with actual profile pic of user*/}
                        <img src="/snake_codec.png" alt="profile_pic" className="w-1/4 min-h-1/2" />
                    </div>
                </div>
                <div></div>
            </div>
            <div id='profileProperties' className="w-1/2 min-h-full flex flex-col text-xl">

                <div className="flex justify-around min-h-1/2">
                    <div />
                    <div className="text-left w-3/5 flex flex-col justify-between">
                        <div />
                        <div className="flex flex-col justify-around min-h-3/5">
                            <ProfileProperty title="Username" property={username} dropDown={DropDown()} />
                            <ProfileProperty title="Email" property={email} dropDown={DropDown()} />
                            <div>Change password</div>
                            <div>Delete user</div>
                        </div>
                        <div />
                    </div>
                    <div />
                </div>
                <div className="flex min-h-1/2">
                    <div className="w-4/10">statistics</div>
                    <div className="w-2/10" />
                    <div className='w-4/10'>friends list</div>
                </div>

            </div>
        </div>
    )

}

export function UserProfileContent(): JSX.Element {
    const [profile, setProfile] = useState<IProfile | null>(null);
    const [user, setUser] = useState<IUser | null>(null);
    const [image, setImage] = useState<string>(CONFIG.PROFILE_DEFAULT_LOGO);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

    async function uploadFiles(formData: FormData) {
        try {
            const response = await api.post(CONFIG.REQUEST_PROFILE_PICTURE_UPLOAD + user?.id, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            console.log("Upload successful:", response.data);
            alert("Files uploaded!");
            for (const value of formData.values()) {
                console.log(value);
            }
            if (selectedFiles) {
                const imageObjectUrl = URL.createObjectURL(selectedFiles[0]);
                setImage(imageObjectUrl);
            }
        } catch (error) {
            console.error("Error uploading files:", error);
            alert("Upload failed.");
        }
    };

    async function handleFileChange(event: BaseSyntheticEvent) {
        setSelectedFiles(event.target.files);
    };

    async function handleSubmit(event: BaseSyntheticEvent) {
        event.preventDefault();

        if (!selectedFiles) {
            alert("Please select files first!");
            return;
        }

        const formData = new FormData();
        formData.append("images", selectedFiles[0]);

        await uploadFiles(formData);
    };

    useEffect(() => {
        async function getUser() {
            const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
            try {
                const result = await api<IUser>({
                    url: CONFIG.REQUEST_USER + user_id
                })
                setUser(result.data);
            }
            catch (e: any) {
                console.error(e);
                throw new Error(ERRORS.PROFILE_USER_FAILED);
            }
        }
        async function getProfile() {
            const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
            try {
                const result = await api<IProfile>({
                    url: CONFIG.REQUEST_PROFILE + user_id
                })
                console.log('getprofile');
                console.log(result);
                setProfile(result.data);
            }
            catch (e: any) {
                console.error(e);
                throw new Error(ERRORS.PROFILE_USER_FAILED);
            }
        }

        getProfile()
        getUser();
    }, [])

    useEffect(() => {
        async function getPicture() {
            try {
                if (profile?.avatar_url === null) {
                    setImage(CONFIG.PROFILE_DEFAULT_LOGO);
                    return;
                }
                const result = await api({
                    url: profile?.avatar_url,
                    responseType: 'blob'
                })
                const imageObjectUrl = URL.createObjectURL(result.data);
                setImage(imageObjectUrl);
            }
            catch (e: any) {
                console.error(e);
                throw new Error('getPicture failed');
            }
        }

        if (profile) {
            getPicture()
        }
    }, [profile])

    return (
        <div id='avatar' className="flex min-w-full min-h-full bg-emerald-500/50 text-center">
            <div className="w-1/2 min-h-full flex flex-col justify-around text-xl">
                <div></div>
                <div id="ProfileAvatarContainer" className="h-3/5 flex flex-col justify-between">
                    <div>{user?.name}</div>
                    <div></div>
                    <div id='profilePicture' className="flex justify-center">
                        {<img src={image} alt="profile_pic" className="w-1/4 min-h-1/2" />}
                    </div>
                    <div></div>
                    <div id='SubmitPictureContainer' className="flex justify-between">
                        <div />
                        <div className="w-1/2">
                            <form onSubmit={handleSubmit} >

                                <div >
                                    <div className="text-left text-base">Change Profile Picture</div>
                                    <div className="flex">
                                        <input
                                            className="border text-sm block w-full placeholder:text-body
                                            file:mr-5 file:py-4 file:px-2
                                            file:text-sm file:font-medium
                                            file:bg-gray-200 file:text-white-700
                                            "
                                            id="file_input"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}

                                        />
                                        <button className="text-sm border" type="submit">Upload Image</button>
                                    </div>
                                </div>

                            </form>
                        </div>
                        <div />
                    </div>
                </div>
                <div></div>
            </div>
            <div id='profileProperties' className="w-1/2 min-h-full flex flex-col text-xl">

                <div className="flex justify-around min-h-1/2">
                    <div />
                    <div className="text-left w-3/5 flex flex-col justify-between">
                        <div />
                        <div className="flex flex-col justify-around min-h-3/5">
                            <ProfileProperty title="Username" property={user?.name} dropDown={ChangeUserName()} />
                            <ProfileProperty title="Email" property={user?.email} dropDown={DropDown()} />
                            <div className="truncate">Change password</div>
                            <div className="truncate">Delete user</div>
                        </div>
                        <div />
                    </div>
                    <div />
                </div>
                <div className="flex min-h-1/2">
                    <div className="w-4/10">statistics</div>
                    <div className="w-2/10" />
                    <div className='w-4/10'>friends list</div>
                </div>

            </div>
        </div>
    )

}

function DropDown(): JSX.Element {
    return (
        <div>lol</div>
    );
}

function ChangeUserName(): JSX.Element {
    const [input, setInput] = useState<string>();

    async function handleChange(event: BaseSyntheticEvent) {
        setInput(event.target.value);
    };


    async function handleSubmit(event: BaseSyntheticEvent) {
        event.preventDefault();

        if (!input) {
            alert("Please give a username!");
            return;
        }

        await requestChange();
    };

    async function requestChange() {
        try {
            const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
            console.log(JSON.stringify({ user_id: Number(user_id), user_name: input }))
            await api.patch(CONFIG.REQUEST_PROFILE_USERNAME_CHANGE, {
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user_id: Number(user_id), user_name: input })
            });
            alert("Username changed!");
        } catch (error) {
            console.error("Error changing UserName:", error);
            alert("Username change failed");
        }
    }
    return (
        <form onSubmit={handleSubmit} >

            <div >
                <div className="flex">
                    <input
                        className="border text-sm block w-full placeholder:text-body"
                        id="changeUserName"
                        type="text"
                        onChange={handleChange}

                    />
                    <button className="text-sm border" type="submit">Change Username</button>
                </div>
            </div>
        </form>

    );
}


function ProfileProperty({ title, property, dropDown }: { title: string, property: string | undefined, dropDown: JSX.Element }): JSX.Element {
    const [showDropdown, setShowDropDown] = useState<boolean>(false);

    function handleChange() {
        setShowDropDown(!showDropdown);
    }

    return (
        <div>
            <div className="flex ">
                <div className="w-1/5 text-xl truncate">{title}</div>
                <div className="w-1/10">•</div>
                <div className="w-2/5 text-left truncate">{property}</div>
                <div className="w-1/10">•</div>
                <div className="w-1/5">
                    <button onClick={handleChange}>{showDropdown ? "Cancel" : "Change"}</button></div>
            </div>
            {showDropdown && dropDown}
        </div>
    )
}
/* v8 ignore stop*/
