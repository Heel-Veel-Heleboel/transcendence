import { JSX, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMatchMakingService } from "../../components/providers/Match";
import { useAuth } from "../../components/providers/Auth";
import { Terminal } from "../../components/layout/Terminal";
import { IMatchHistoryEntry } from "../../shared/types/matchmaking";

export function MatchHistory({ userId }: { userId?: string }): JSX.Element {
    const matchService = useMatchMakingService();
    const auth = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [matches, setMatches] = useState<IMatchHistoryEntry[]>([]);

    useEffect(() => {
        async function fetchHistory() {
            try {
                const id = userId ?? auth.userId;
                const result = await matchService.getPlayerHistory(id);
                setMatches(result.data.matches);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, [userId]);

    return (
        <Terminal title="match history">
            {loading && <div className="p-2">loading...</div>}
            {error && <div className="p-2">error</div>}
            {!loading && !error && matches.length === 0 && (
                <div className="p-2 text-sm">no matches yet</div>
            )}
            {!loading && !error && matches.length > 0 && (
                <ul className="text-left text-sm">
                    {matches.map((match) => (
                        <MatchRow key={match.matchId} match={match} onNavigate={navigate} />
                    ))}
                </ul>
            )}
        </Terminal>
    );
}

function MatchRow({ match, onNavigate }: { match: IMatchHistoryEntry; onNavigate: (path: string) => void }): JSX.Element {
    const date = new Date(match.completedAt).toLocaleDateString();
    const resultLabel = match.isWinner ? "W" : "L";
    const resultColor = match.isWinner ? "text-green-400" : "text-red-400";
    const modeLabel = match.gameMode === "powerup" ? "⚡" : "●";

    return (
        <li className="flex justify-between items-center border-b border-black px-2 py-1 gap-2">
            <span className={`font-bold w-4 ${resultColor}`}>{resultLabel}</span>
            <button
                className="flex-1 text-left hover:underline truncate"
                onClick={() => onNavigate(`/profile/${match.opponentId}`)}
            >
                {match.opponentUsername}
            </button>
            <span className="tabular-nums">{match.userScore}–{match.opponentScore}</span>
            <span title={match.gameMode}>{modeLabel}</span>
            {match.tournamentId !== null && <span title="tournament">🏆</span>}
            <span className="text-xs opacity-70">{date}</span>
        </li>
    );
}
