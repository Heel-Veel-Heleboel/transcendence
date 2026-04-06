import { useState } from 'react';
import { getCookie, setCookie } from '../../shared/utils/cookies';

const userIdCookieName = 'user_id'

export default function useUserId() {
    const [userId, setUserId] = useState(getUserId());

    function getUserId() {
        return (getCookie(userIdCookieName));
    };

    function saveUserId(newUserId: string) {
        setCookie(userIdCookieName, newUserId, 7);
        setUserId(newUserId);
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
