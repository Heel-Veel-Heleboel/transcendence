import { useEffect, useState } from "react";
import { useUserService } from "../../components/providers/User";
import { useAuth } from "../../components/providers/Auth";
import { Terminal } from "../../components/layout/Terminal";
import { IProfile } from "../../shared/types/profile";
import { DEFAULT_PROFILE } from "../../shared/constants/defaults";
import { useNotifications } from "../../components/hooks/Notifications";

export function ProfileStats({ userId }: { userId?: string }) {

    const { matchUpdate } = useNotifications();
    const userService = useUserService();
    const auth = useAuth();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [profile, setProfile] = useState<IProfile>(DEFAULT_PROFILE);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const id = userId ?? auth.userId;
                const result = await userService.getProfile(id);
                setProfile(result.data);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [userId, matchUpdate]);

    return (
        <Terminal title="statistics">
            {loading && <div className="p-2">loading...</div>}
            {error && <div className="p-2">error</div>}
            {!loading && !error && (
                <ul className="text-left p-2 flex flex-col gap-1">
                    <li className="flex justify-between">
                        <span>wins</span>
                        <span className="text-green-400">{profile.wins}</span>
                    </li>
                    <li className="flex justify-between">
                        <span>losses</span>
                        <span className="text-red-400">{profile.losses}</span>
                    </li>
                    <li className="flex justify-between">
                        <span>games</span>
                        <span>{profile.games_played}</span>
                    </li>
                    <li className="flex justify-between">
                        <span>win rate</span>
                        <span>{profile.win_rate.toFixed(1)}%</span>
                    </li>
                </ul>
            )}
        </Terminal>
    );
}
