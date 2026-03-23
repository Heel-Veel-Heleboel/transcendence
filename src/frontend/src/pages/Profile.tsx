import { BaseSyntheticEvent, JSX, ReactNode, useEffect, useState } from "react"
import api from "../api";
import { CONFIG } from "../constants/AppConfig";
import { getCookie } from "../components/utils/cookies";
import { ERRORS } from "../constants/Errors";
import { MainContainer } from "../components/sections/MainContainer";
import { Widget } from "../components/utils/MenuUtils";
import { useNavigate } from "react-router-dom";
import { IProfile, IUser } from "../types/profile";
import { useAuth } from "../components/providers/Auth";

/* v8 ignore start */


export function Profile(): JSX.Element {
    const auth = useAuth();
    const navigate = useNavigate();

    if (!auth.token) {
        navigate('/');
    }

    return (
        <MainContainer children={
            <Widget logoPath={CONFIG.PROFILE_LOGO} title={CONFIG.PROFILE_TITLE} width="w-full" child={<UserProfileContent />} />
        } />
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
        <ProfileContainer >
            <ProfileAvatarContainer >
                <ProfilePicture username={user?.name} image={image} />
                <SubmitContainer handleSubmit={handleSubmit} handleFileChange={handleFileChange} />
            </ProfileAvatarContainer >

            <ProfileProperties>
                <ProfilePropertiesPrimary>
                    <Username username={user?.name} />
                    <Email email={user?.email} />
                    <Password />
                    <DeleteAccount />
                </ProfilePropertiesPrimary>
                <ProfilePropertiesSecundary>
                    <div className="w-4/10">statistics</div>
                    <div className="w-2/10" />
                    <div className='w-4/10'>friends list</div>
                </ProfilePropertiesSecundary>
            </ProfileProperties>

        </ProfileContainer >
    )
}


export function ProfileContainer({ children }: { children: ReactNode }) {
    return (
        <div id='avatar' className="flex min-w-full min-h-full bg-emerald-500/50 text-center">
            {children}
        </div>
    )
}

export function ProfileAvatarContainer({ children }: { children: ReactNode }) {
    return (
        <div className="w-1/2 min-h-full flex flex-col justify-around text-xl">
            <div id="ProfileAvatarContainer" className="h-3/5">
                <div className="flex flex-col justify-between">
                    {children}
                </div>
            </div>
        </div>
    )
}


export function ProfilePropertiesPrimary({ children }: { children: ReactNode }) {
    return (
        <div className="flex justify-around min-h-1/2">
            <div />
            <div className="text-left w-3/5 flex flex-col justify-between min-h-full">
                <div />
                <div className="flex flex-col justify-around min-h-3/5">
                    {children}
                </div>
                <div />
            </div>
            <div />
        </div>
    )
}

export function ProfilePropertiesSecundary({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-1/2">
            {children}
        </div>

    )
}

export function ProfileProperties({ children }: { children: ReactNode }) {
    return (
        <div id='profileProperties' className="w-1/2 min-h-full flex flex-col text-xl">
            {children}
        </div>
    )

}

export function ProfilePicture({ username, image }: { username: string | undefined, image: string }) {
    return (
        <div>
            <div>{username}</div>
            <div id='profilePicture' className="flex justify-center">
                {<img src={image} alt="profile_pic" className="w-1/4 min-h-1/2" />}
            </div>
        </div>
    )
}

export function SubmitContainer({ handleSubmit, handleFileChange }: { handleSubmit: (event: BaseSyntheticEvent) => void, handleFileChange: (event: BaseSyntheticEvent) => void }) {
    return (
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
                                           file:bg-gray-200 file:text-white-700"
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
    )
}

function SubmitPropertyChange(handleChange: (event: BaseSyntheticEvent) => void, handleSubmit: (event: BaseSyntheticEvent) => void, buttonText: string) {
    return (
        <form onSubmit={handleSubmit} >
            <div >
                <div className="flex">
                    <input
                        className="border text-sm block w-full placeholder:text-body"
                        id={buttonText.replace(/\s/g, "") + 'Container'}
                        type="text"
                        onChange={handleChange}

                    />
                    <button className="text-sm border" type="submit">{buttonText}</button>
                </div>
            </div>
        </form>
    )
}

function ChangeUserName(resetState: () => void): JSX.Element {
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
            await api({
                url: CONFIG.REQUEST_PROFILE_CHANGE_USERNAME,
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json",
                },
                data: JSON.stringify({ user_id: Number(user_id), user_name: input }),
            })
            resetState();
            alert("Username changed!");
        } catch (error) {
            console.error("Error changing UserName:", error);
            alert("Username change failed");
        }
    }
    return (SubmitPropertyChange(handleChange, handleSubmit, 'Change Username'));
}


function ChangeEmail(resetState: () => void): JSX.Element {
    const [input, setInput] = useState<string>();

    async function handleChange(event: BaseSyntheticEvent) {
        setInput(event.target.value);
    };


    async function handleSubmit(event: BaseSyntheticEvent) {
        event.preventDefault();

        if (!input) {
            alert("Please give a email!");
            return;
        }
        await requestChange();
    };

    async function requestChange() {
        try {
            const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
            await api({
                url: CONFIG.REQUEST_PROFILE_CHANGE_EMAIL,
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json",
                },
                data: JSON.stringify({ user_id: Number(user_id), user_email: input }),
            })
            resetState();
            alert("Email changed!");
        } catch (error) {
            console.error("Error changing Email:", error);
            alert("Email change failed");
        }
    }
    return (SubmitPropertyChange(handleChange, handleSubmit, 'Change Email'));
}


function DisplayedProfileProperty({ title, property, dropDown, toggleDropDown, showDropdown }: { title: string, property: string | undefined, dropDown: JSX.Element, toggleDropDown: () => void, showDropdown: boolean }): JSX.Element {
    return (
        <div>
            <div className="flex ">
                <div className="w-1/5 text-xl truncate">{title}</div>
                <div className="w-1/10">•</div>
                <div className="w-2/5 text-left truncate">{property}</div>
                <div className="w-1/10">•</div>
                <div className="w-1/5">
                    <button onClick={toggleDropDown}>{showDropdown ? "Cancel" : "Change"}</button>
                </div>
            </div>
            {showDropdown && dropDown}
        </div>
    )
}

function SubmitPropertyChangeOldNew(
    handleChangeOld: (event: BaseSyntheticEvent) => void,
    handleChangeNew: (event: BaseSyntheticEvent) => void,
    handleSubmit: (event: BaseSyntheticEvent) => void,
    buttonText: string,
) {

    return (
        <form onSubmit={handleSubmit} >
            <div >
                <div className="flex flex-col">
                    <input
                        className="border text-sm block w-full placeholder:text-body"
                        id="oldPropertyContainer"
                        type="text"
                        onChange={handleChangeOld}

                    />
                    <input
                        className="border text-sm block w-full placeholder:text-body"
                        id="newPropertyChange"
                        type="text"
                        onChange={handleChangeNew}

                    />
                    <button className="text-sm border" type="submit">{buttonText}</button>
                </div>
            </div>
        </form>
    )
}

function ChangePassword(resetState: () => void): JSX.Element {
    const [oldPassword, setOldPassword] = useState<string>();
    const [newPassword, setNewPassword] = useState<string>();

    async function handleChangeOld(event: BaseSyntheticEvent) {
        setOldPassword(event.target.value);
    };

    async function handleChangeNew(event: BaseSyntheticEvent) {
        setNewPassword(event.target.value);
    };


    async function handleSubmit(event: BaseSyntheticEvent) {
        event.preventDefault();

        if (!oldPassword) {
            alert("Please give your current password!");
            return;
        }
        if (!newPassword) {
            alert("Please give your new password!");
            return;
        }
        await requestChange();
    };

    async function requestChange() {
        try {
            const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
            await api({
                url: CONFIG.REQUEST_PROFILE_CHANGE_PASSWORD,
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json",
                },
                data: JSON.stringify({ user_id: Number(user_id), current_password: oldPassword, new_password: newPassword }),
            })
            resetState();
            alert("Password changed!");
        } catch (error) {
            console.error("Error changing Password:", error);
            alert("Password change failed");
        }
    }
    return (SubmitPropertyChangeOldNew(handleChangeOld, handleChangeNew, handleSubmit, 'Change Password'));
}
function HiddenProfileProperty({ title, dropDown, toggleDropDown, showDropdown }: { title: string, dropDown: JSX.Element, toggleDropDown: () => void, showDropdown: boolean }): JSX.Element {
    return (
        <div>
            <div className="flex ">
                <div className="w-full text-xl truncate">
                    <button onClick={toggleDropDown}>{showDropdown ? "Cancel " + title : title}</button>
                </div>
            </div>
            {showDropdown && dropDown}
        </div>
    )
}

function Username({ username }: { username: string | undefined }) {
    const [showDropdown, setShowDropDown] = useState<boolean>(false);

    function handleChange() {
        setShowDropDown(!showDropdown);
    }
    return (
        <DisplayedProfileProperty title="Username" property={username} dropDown={ChangeUserName(handleChange)} toggleDropDown={handleChange} showDropdown={showDropdown} />
    )
}

function Email({ email }: { email: string | undefined }) {
    const [showDropdown, setShowDropDown] = useState<boolean>(false);

    function handleChange() {
        setShowDropDown(!showDropdown);
    }
    return (
        <DisplayedProfileProperty title="Email" property={email} dropDown={ChangeEmail(handleChange)} toggleDropDown={handleChange} showDropdown={showDropdown} />
    )
}


function Password() {
    const [showDropdown, setShowDropDown] = useState<boolean>(false);

    function handleChange() {
        setShowDropDown(!showDropdown);
    }
    return (
        <HiddenProfileProperty title="Change Password" dropDown={ChangePassword(handleChange)} toggleDropDown={handleChange} showDropdown={showDropdown} />
    )
}

function DeleteAccount() {
    const [showDropdown, setShowDropDown] = useState<boolean>(false);
    const auth = useAuth();

    function handleDropDown() {
        setShowDropDown(!showDropdown);
    }

    async function requestDelete() {
        try {
            const user_id = getCookie(CONFIG.USERID_COOKIE_NAME);
            await api({
                url: CONFIG.REQUEST_PROFILE_DELETE,
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json",
                },
                data: JSON.stringify({ user_id: Number(user_id) }),
            })
            handleDropDown();
            alert("Deleted account!");
            auth.gotoLogin();
        } catch (error) {
            console.error("Error deleting Account:", error);
            alert("Deleting account failed");
        }
    }
    return (
        <div id="DeleteAccountContainer">
            <div className="flex flex-col">
                <div className="w-full">
                    <button onClick={handleDropDown}>Delete User</button>
                </div>
            </div>
            {
                showDropdown &&
                <div className="w-full border flex py-2">
                    <div className="w-2/5">
                        <span>Are you sure?: </span>

                    </div>
                    <div className="flex w-3/5">
                        <button className="border w-1/2" onClick={requestDelete}>Yes</button>
                        <button className="border w-1/2" onClick={handleDropDown}>No</button>
                    </div>
                </div>
            }
        </div>
    )
}


/* v8 ignore stop*/
