import { useNotifications } from "../providers/Notifications";

export function connectNotifications() {
    const notif = useNotifications();

    async function connect() {
        if (notif) {
            await notif.join();
        }
    }
    connect();
    return (notif);
}
