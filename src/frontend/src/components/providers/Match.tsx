import { createContext, ReactNode, useContext, } from 'react';
import { MatchmakingService } from '../../shared/api/matchmaking';
import { IDirectChallenge, IMatchmakingService, ISetTournament } from '../../shared/types/matchmaking';

const service = new MatchmakingService();

const MatchmakingServiceContext = createContext<IMatchmakingService | undefined>(undefined);

export function useMatchMakingService() {
    const userContext = useContext(MatchmakingServiceContext);
    if (userContext === undefined) {
        throw new Error('useMatchMakingService has to be used within MatchProvider');
    }
    return userContext;
}

export function MatchProvider({ children }: { children: ReactNode }) {

    async function getStatus() {
        try {
            const response = await service.getStatus();
            return (response);
        } catch (e: any) {
            console.error(e);
            // TODO: add error handling
            throw e
        }
    }

    async function getMatchInfo(matchId: string) {
        try {
            const response = await service.getMatchInfo(matchId);
            return response
        } catch (e: any) {
            console.error(e);
            throw e
        }
    }

    async function getTournamentInfo(tournamentId: string) {
        try {
            const response = await service.getTournamentInfo(tournamentId);
            return response
        } catch (e: any) {
            console.error(e);
            throw e
        }
    }

    async function getTournaments() {
        try {
            const response = await service.getTournaments();
            return response
        } catch (e: any) {
            console.error(e);
            throw e
        }
    }

    async function setTournament(data: ISetTournament) {
        try {
            const response = await service.setTournament(data);
            return response
        } catch (e: any) {
            console.error(e);
            throw e
        }
    }

    async function cancelTournament(tournamentId: string) {
        try {
            const response = await service.cancelTournament(tournamentId);
            return response
        } catch (e: any) {
            console.error(e);
            throw e
        }
    }

    async function registerTournament(tournamentId: string) {
        try {
            const response = await service.registerTournament(tournamentId);
            return response
        } catch (e: any) {
            console.error(e);
            throw e
        }
    }

    async function unregisterTournament(tournamentId: string) {
        try {
            const response = await service.unregisterTournament(tournamentId);
            return response
        } catch (e: any) {
            console.error(e);
            throw e
        }
    }

    async function joinClassic() {
        try {
            const response = await service.joinClassic();
            return (response);
        } catch (e: any) {
            console.error(e);
            // TODO: add error handling
            throw e
        }
    }

    async function leaveClassic() {
        try {
            const response = await service.leaveClassic();
            return (response);
        } catch (e: any) {
            console.error(e);
            // TODO: add error handling
            throw e
        }
    }

    async function joinPowerup() {
        try {
            const response = await service.joinPowerup();
            return (response);
        } catch (e: any) {
            console.error(e);
            // TODO: add error handling
            throw e
        }
    }

    async function leavePowerup() {
        try {
            const response = await service.leavePowerup();
            return (response);
        } catch (e: any) {
            console.error(e);
            // TODO: add error handling
            throw e
        }
    }

    async function sendDirectChallenge(data: IDirectChallenge) {
        try {
            const response = await service.sendDirectChallenge(data);
            return response;
        } catch (e: any) {
            console.error(e);
            throw e;
        }
    }

    return (
        <MatchmakingServiceContext.Provider value={{
            getStatus,
            getMatchInfo,
            getTournamentInfo,
            getTournaments,
            setTournament,
            cancelTournament,
            registerTournament,
            unregisterTournament,
            joinClassic,
            leaveClassic,
            joinPowerup,
            leavePowerup,
            sendDirectChallenge
        }}>
            {children}
        </MatchmakingServiceContext.Provider >
    );
}
