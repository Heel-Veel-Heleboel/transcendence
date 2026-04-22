import { JSX, ReactNode, useEffect, useState } from "react";
import { MainContainer } from "../components/layout/MainContainer";
import { useNavigate, useParams } from "react-router-dom";
import { IMatches, IParticipants, IRanking, ITournament, ITournamentSketchProps } from "../shared/types/matchmaking";
import { Terminal } from "../components/layout/Terminal";
import { useMatchMakingService } from "../components/providers/Match";
import { DEFAULT_MATCHES, DEFAULT_PARTICIPANTS, DEFAULT_TOURNAMENT } from "../shared/constants/defaults";
import { P5Canvas, P5CanvasInstance, SketchProps } from "@p5-wrapper/react"
import p5 from 'p5';

export function Tournament(): JSX.Element {
    const { tournamentId } = useParams()

    if (tournamentId === undefined) {
        throw new Error('no param');
    }

    return (
        < MainContainer >
            <TournamentContainer >
                <TournamentInfo>
                    <TournamentGeneralInfo tournamentId={tournamentId} />
                    <TournamentRankings tournamentId={tournamentId} />
                    <TournamentParticipants tournamentId={tournamentId} />
                </TournamentInfo>
                <TournamentBrackets tournamentId={tournamentId} />
            </TournamentContainer>
        </MainContainer >
    )
}

export function TournamentContainer({ children }: { children: ReactNode }): JSX.Element {
    return (

        <div className="w-full min-h-full flex flex-col">
            {children}
        </div>

    )
}

export function TournamentInfo({ children }: { children: ReactNode }) {
    return (
        <div className="h-1/2 flex justify-around">
            {children}
        </div>
    )
}


export function TournamentBrackets({ tournamentId }: { tournamentId: string }) {
    const service = useMatchMakingService();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [matches, setMatches] = useState<IMatches>(DEFAULT_MATCHES);

    useEffect(() => {
        async function getTournamentBrackets() {
            try {
                const result = await service.getTournamentMatches(tournamentId);
                setMatches(result.data);
                console.log(result.data);
            } catch (e: any) {
                console.error(e);
                setError(e);
            } finally {
                setLoading(false);
            }
        }
        getTournamentBrackets();
    }, [])

    if (loading) {
        return (
            <div id="tournament-info-loading">
                loading
            </div>
        )
    }

    if (error) {
        return (
            <div id="tournament-info-error">
                error
            </div>
        )
    }

    if (matches.bracket.length === 0) {
        return (
            <div>
                no visualization available
            </div>
        )

    }

    function sketch(p5: P5CanvasInstance<ITournamentSketchProps>) {
        let nodeX: number;
        let nodeY: number;
        let matches: IMatches;
        const divName = "tournament-p5-canvas"
        const sketchWidth = document.getElementById(divName)?.offsetWidth ?? 1420;
        const sketchHeight = document.getElementById(divName)?.offsetHeight ?? 1080;
        const aspectRatio = sketchWidth / sketchHeight;
        let scaleFactor = 1;


        p5.updateWithProps = props => {
            nodeX = props.nodeX;
            nodeY = props.nodeY;
            matches = props.matches;
        }

        p5.setup = () => {
            const { canvasWidth, canvasHeight } = updateCanvasDimensions();
            const renderer = p5.createCanvas(canvasWidth, canvasHeight);
            renderer.parent(divName);
            scaleFactor = sketchWidth / canvasWidth;

            p5.pixelDensity(window.devicePixelRatio);
            p5.strokeWeight(2 * scaleFactor);
            // p5.textFont('Courier New');
            // p5.textSize(24);
        };

        function visualizeRootNode(matches: IMatches, nodeWidth: number, nodeHeight: number) {
            const posX = p5.width / 2;
            const posY = p5.width / 2;
            const bracket = matches.bracket[0];
            const text = `${bracket.player1Username} - ${bracket.player2Username}`
            p5.rect(posX, posY, nodeWidth, nodeHeight / 2);
            p5.text(text, posX, posY);
        }

        p5.draw = () => {
            p5.background(100);
            // p5.clear();

            const sections = (nodeX * 2) - 1;
            const sectionWidth = p5.width / sections;
            // const middle = sectionWidth * (sections / 2)
            const nodeWidth = sectionWidth / 2;
            const nodeHeight = (p5.height / nodeY) / 2;
            // const level = 0;
            visualizeRootNode(matches, nodeWidth, nodeHeight);

        };

        p5.windowResized = () => {
            p5.setup();
        }

        function updateCanvasDimensions() {
            if (p5.windowWidth / p5.windowHeight > aspectRatio) {
                return {
                    canvasWidth: p5.windowHeight * aspectRatio,
                    canvasHeight: p5.windowHeight
                }
            }
            return (
                {
                    canvasWidth: p5.windowWidth,
                    canvasHeight: p5.windowWidth / aspectRatio
                }
            )
        }
    }

    function renderBrackets() {
        const nodeX = matches.totalRounds;
        const nodeY = Math.pow(2, nodeX - 1) / 2;
        console.log(`nodeX: ${nodeX} nodeY: ${nodeY}`);
        return <P5Canvas sketch={sketch} matches={matches} nodeX={nodeX} nodeY={nodeY} />;
    }

    return (
        <div id="tournament-p5-canvas" className="h-1/2 w-full">
            bracket rendering {matches.totalRounds}
            {renderBrackets()}
        </div>
    )
}

export function TournamentGeneralInfo({ tournamentId }: { tournamentId: string }) {
    const service = useMatchMakingService();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [tournament, setTournament] = useState<ITournament>(DEFAULT_TOURNAMENT);

    useEffect(() => {
        async function getTournament() {
            try {
                const result = await service.getTournamentInfo(tournamentId);
                console.log(result.data.tournament);
                setTournament(result.data.tournament);
            } catch (e: any) {
                console.error(e);
                setError(e);
            } finally {
                setLoading(false);
            }
        }
        getTournament();
    }, [])

    if (loading) {
        return (
            <div id="tournament-info-loading">
                loading
            </div>
        )
    }

    if (error) {
        return (
            <div id="tournament-info-error">
                error
            </div>
        )
    }
    return (
        <div className="flex flex-col justify-between">
            <div></div>
            <div>name: {tournament.name}</div>
            <div>mode: {tournament.gameMode}</div>
            <div>status: {tournament.status}</div>
            <div>participants: {tournament.participantCount}</div>
            <div></div>
        </div>
    )
}

export function TournamentParticipants({ tournamentId }: { tournamentId: string }) {
    const service = useMatchMakingService();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [participants, setParticipants] = useState<IParticipants>(DEFAULT_PARTICIPANTS);
    const navigate = useNavigate();

    useEffect(() => {
        async function getTournamentParticipants() {
            try {
                const result = await service.getTournamentParticipants(tournamentId);
                console.log(result)
                setParticipants(result.data);
            } catch (e: any) {
                console.error(e);
                setError(e);
            } finally {
                setLoading(false);
            }
        }
        getTournamentParticipants();
    }, [])

    if (loading) {
        return (
            <div id="tournament-participants-loading">
                loading
            </div>
        )
    }

    if (error) {
        return (
            <div id="tournament-participants-error">
                error
            </div>
        )
    }

    function List(list: number[]) {
        if (!list)
            return
        const listItems = list.map((item) =>
            <li key={item}>
                <div className='flex justify-between' id={'participant-' + item + '-container'}>
                    <button onClick={() => navigate('/profile/' + item)}>
                        {item}
                    </button>
                </div>
            </li>
        );
        return <ul>{listItems}</ul>;
    }
    return (
        <div className="flex flex-col">
            <div className="h-1/10"></div>
            <div className="h-8/10">
                <Terminal title="participants" >
                    {List(participants.participantIds)}
                </Terminal >
            </div>
            <div className="h-1/10"></div>
        </div>
    )
}

export function TournamentRankings({ tournamentId }: { tournamentId: string }) {
    const service = useMatchMakingService();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [rankings, setRankings] = useState<IRanking[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        async function getTournamentRankings() {
            try {
                const result = await service.getTournamentRanking(tournamentId);
                console.log(result)
                setRankings(result.data.rankings);
            } catch (e: any) {
                console.error(e);
                setError(e);
            } finally {
                setLoading(false);
            }
        }
        getTournamentRankings();
    }, [])

    if (loading) {
        return (
            <div id="tournament-rankings-loading">
                loading
            </div>
        )
    }

    if (error) {
        return (
            <div id="tournament-rankings-error">
                error
            </div>
        )
    }

    function List(list: IRanking[]) {
        if (!list)
            return
        const listItems = list.map((item: IRanking) =>
            <li key={item.userId}>
                <div className='flex justify-between' id={'ranking-' + item.userId + '-container'}>
                    <button onClick={() => navigate('/profile/' + item.userId)}>
                        {item.rank + ': ' + item.username}
                    </button>
                </div>
            </li>
        );
        return <ul>{listItems}</ul>;
    }
    return (
        <div className="flex flex-col">
            <div className="h-1/10"></div>
            <div className="h-8/10">
                <Terminal title="rankings" >
                    {List(rankings)}
                </Terminal >
            </div>
            <div className="h-1/10"></div>
        </div>
    )
}

