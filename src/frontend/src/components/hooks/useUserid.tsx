import { useState } from 'react';
import { getCookie, setCookie } from '../../shared/utils/cookies';

const userIdCookieName = 'user_id'

export default function useUserId() {
    function getUserCookie() {
        return (getCookie(userIdCookieName));
    };

    const [userId, setUserId] = useState(getUserCookie());

    function saveUserId(newUserId: string) {
        setCookie(userIdCookieName, newUserId, 7);
        setUserId(userId);
    };

    const removeUserId = () => {
        setCookie(userIdCookieName, userId, -1);
        setUserId('');
    };

    return {
        setUserId: saveUserId,
        userId,
        removeUserId
    };
}
