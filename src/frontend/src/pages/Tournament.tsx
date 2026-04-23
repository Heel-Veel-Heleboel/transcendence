import { JSX, ReactNode, useEffect, useState } from "react";
import { MainContainer } from "../components/layout/MainContainer";
import { useNavigate, useParams } from "react-router-dom";
import { IBracket, IMatches, IParticipants, IRanking, ITournament, ITournamentSketchProps } from "../shared/types/matchmaking";
import { Terminal } from "../components/layout/Terminal";
import { useMatchMakingService } from "../components/providers/Match";
import { DEFAULT_MATCHES, DEFAULT_PARTICIPANTS, DEFAULT_TOURNAMENT } from "../shared/constants/defaults";
import { P5Canvas, P5CanvasInstance } from "@p5-wrapper/react"
import p5 from 'p5';
import { CONFIG } from "../shared/config/AppConfig";
import { Widget } from "../components/layout/Widget";

export function Tournament(): JSX.Element {
    const { tournamentId } = useParams()

    if (tournamentId === undefined) {
        throw new Error('no param');
    }

    return (
        < MainContainer >
            <Widget logoPath={CONFIG.TOURNAMENT_LOGO} title={'tournament'} width="w-full" >
                <TournamentContainer >
                    <TournamentInfo>
                        <TournamentGeneralInfo tournamentId={tournamentId} />
                        <TournamentRankings tournamentId={tournamentId} />
                        <TournamentParticipants tournamentId={tournamentId} />
                    </TournamentInfo>
                    <TournamentBrackets tournamentId={tournamentId} />
                </TournamentContainer>
            </Widget>
        </MainContainer >
    )
}

export function TournamentContainer({ children }: { children: ReactNode }): JSX.Element {
    return (

        <div className="w-full min-h-full flex flex-col bg-blue-500/50">
            {children}
        </div>

    )
}

export function TournamentInfo({ children }: { children: ReactNode }) {
    return (
        <div className="h-1/3 w-full flex justify-around border">
            {children}
            <div id="tournament-info-space-buffer"></div>
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
        let nodes: Node[];
        const divName = "tournament-p5-canvas"


        p5.updateWithProps = props => {
            matches = props.matches;
            nodeX = matches.totalRounds;
            nodeY = Math.pow(2, nodeX - 1) / 2;
        }

        p5.setup = () => {
            const sketchWidth = document.getElementById(divName)?.offsetWidth ?? 1420;
            const sketchHeight = document.getElementById(divName)?.offsetHeight ?? 1080;
            const renderer = p5.createCanvas(sketchWidth, sketchHeight);
            renderer.parent(divName);

            p5.textSize(p5.width / 100);
            p5.pixelDensity(window.devicePixelRatio);

            const sections = (nodeX * 2) - 1;
            const sectionWidth = p5.width / sections;
            const middle = sectionWidth * (sections / 2)
            const nodeWidth = sectionWidth / 2;
            const nodeHeight = (p5.height / nodeY) / 4;
            let level = 1;

            const root = rootNode(matches.bracket[0], level, middle, nodeWidth, nodeHeight);
            nodes = [];
            nodes.push(root);

            if (matches.bracket.length < 3) {
                return;
            }

            level++;

            const left = new Node(1, middle - sectionWidth, root.y, nodeWidth, nodeHeight, matches.bracket[1], root);
            nodes.push(left);
            const right = new Node(2, middle + sectionWidth, root.y, nodeWidth, nodeHeight, matches.bracket[2], root);
            nodes.push(right);

            if (matches.bracket.length < 7) {
                return;
            }

            level++;

            createBranch({
                brackets: matches.bracket,
                level: level,
                maxLevel: nodeX,
                sectionWidth: sectionWidth,
                nodeWidth: nodeWidth,
                nodeHeigth: nodeHeight,
                parent: left,
                isLeft: true,
            });

            createBranch({
                brackets: matches.bracket,
                level: level,
                maxLevel: nodeX,
                sectionWidth: sectionWidth,
                nodeWidth: nodeWidth,
                nodeHeigth: nodeHeight,
                parent: right,
                isLeft: false,
            });

        };

        interface IBracketBranch {
            brackets: IBracket[];
            level: number;
            maxLevel: number;
            sectionWidth: number
            nodeWidth: number;
            nodeHeigth: number;
            parent: Node
            isLeft: boolean
        }

        function createBranch(p: IBracketBranch) {
            if (p.level > p.maxLevel) {
                return;
            }

            const posX = p.isLeft ? p.parent.x - p.sectionWidth : p.parent.x + p.sectionWidth;
            const index = p.parent.i;
            const leftIndex = 2 * index + 1;
            const rightIndex = 2 * index + 2;
            const amountOfNodesForLevel = Math.pow(2, p.level - 1) / 2;
            const heightPerNode = p5.height / amountOfNodesForLevel;
            const top = p.parent.y + heightPerNode / 2;
            const bottom = p.parent.y - heightPerNode / 2;
            const leftNodeY = p.isLeft ? top : bottom;
            const rightNodeY = p.isLeft ? bottom : top;
            const leftNode = new Node(leftIndex, posX, leftNodeY, p.nodeWidth, p.nodeHeigth, p.brackets[leftIndex], p.parent);
            nodes.push(leftNode);
            const rightNode = new Node(rightIndex, posX, rightNodeY, p.nodeWidth, p.nodeHeigth, p.brackets[rightIndex], p.parent);
            nodes.push(rightNode);

            createBranch({
                brackets: p.brackets,
                level: p.level + 1,
                maxLevel: p.maxLevel,
                sectionWidth: p.sectionWidth,
                nodeWidth: p.nodeWidth,
                nodeHeigth: p.nodeHeigth,
                parent: leftNode,
                isLeft: p.isLeft
            })

            createBranch({
                brackets: p.brackets,
                level: p.level + 1,
                maxLevel: p.maxLevel,
                sectionWidth: p.sectionWidth,
                nodeWidth: p.nodeWidth,
                nodeHeigth: p.nodeHeigth,
                parent: rightNode,
                isLeft: p.isLeft
            })


        }

        function rootNode(bracket: IBracket, level: number, posX: number, nodeWidth: number, nodeHeight: number) {
            const posY = p5.height / 2;
            const node = new Node(level, posX, posY, nodeWidth, nodeHeight, bracket, null);
            return (node);
        }

        p5.draw = () => {
            p5.clear();

            for (const node of nodes) {
                node.drawLinesToParent();
            }
            for (const node of nodes) {
                node.draw();
            }

        };

        p5.windowResized = () => {
            p5.setup();
        }

        class Node {
            public i: number;
            public x: number;
            public y: number;
            public w: number;
            public h: number;
            private parent: Node | null;
            private participants: string;
            private winner: string;

            constructor(i: number, x: number, y: number, w: number, h: number, bracket: IBracket, parent: Node | null) {
                this.i = i;
                this.x = x;
                this.y = y;
                this.w = w;
                this.h = h;
                this.parent = parent;
                this.participants = `${bracket.player1Username} - ${bracket.player2Username}`
                const winnerPreFix = 'winner: '
                this.winner =
                    !bracket.winnerId ?
                        winnerPreFix + 'TBH'
                        : bracket.winnerId === bracket.player1Id ?
                            winnerPreFix + bracket.player1Username
                            : bracket.winnerId === bracket.player2Id ?
                                winnerPreFix + bracket.player2Username
                                : 'unknown';
            }

            drawLinesToParent() {
                if (this.parent === null) {
                    return
                }
                const isLeft = this.x < this.parent.x ? true : false;
                const xDiff = isLeft ? this.parent.x - this.x : this.x - this.parent.x;
                const xMiddle = xDiff / 2;
                const posX = isLeft ? this.x + xMiddle : this.x - xMiddle;

                p5.stroke('white');
                p5.line(this.x, this.y, posX, this.y);
                p5.line(posX, this.y, posX, this.parent.y);
                p5.line(posX, this.parent.y, this.parent.x, this.parent.y);
            }

            draw() {
                p5.stroke('black');
                p5.rectMode(p5.CENTER)
                p5.rect(this.x, this.y, this.w, this.h);
                p5.textAlign(p5.CENTER, p5.CENTER)
                p5.text(this.participants, this.x, this.y - (this.h / 4));
                p5.text(this.winner, this.x, this.y + (this.h / 4));
            }

        }

    }

    function renderBrackets() {
        return <P5Canvas sketch={sketch} matches={matches} />;
    }

    return (
        <div id="tournament-p5-canvas" className="h-2/3 w-full border">
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
        <div id='tournament-general-info' className="w-1/3 flex flex-col justify-between">
            <div id="tournament-general-info-top-buffer" className="h-1/10"></div>
            <div id="tournament-general-info-terminal" className="h-8/10">
                <Terminal title="info">
                    <div id="tournament-general-info-name" className="flex">
                        <div className="text-left w-2/5">name: </div>
                        <div className="w-1/5" />
                        <div className="text-left w-2/5">{tournament.name}</div>
                    </div>
                    <div id="tournament-general-info-mode" className="flex">
                        <div className="text-left w-2/5">mode: </div>
                        <div className="w-1/5" />
                        <div className="text-left w-2/5">{tournament.gameMode}</div>
                    </div>
                    <div id="tournament-general-info-status" className="flex">
                        <div className="text-left w-2/5">status: </div>
                        <div className="w-1/5" />
                        <div className="text-left w-2/5">{tournament.status.toLowerCase()}</div>
                    </div>
                    <div id="tournament-general-info-participants" className="flex">
                        <div className="text-left w-2/5">participants: </div>
                        <div className="w-1/5" />
                        <div className="text-left w-2/5">{tournament.participantCount}</div>
                    </div>
                    <div id="tournament-general-info-min-players" className="flex">
                        <div className="text-left w-2/5">min-# of players: </div>
                        <div className="w-1/5" />
                        <div className="text-left w-2/5">{tournament.minPlayers}</div>
                    </div>
                    <div id="tournament-general-info-max-players" className="flex">
                        <div className="text-left w-2/5">max-# of players: </div>
                        <div className="w-1/5" />
                        <div className="text-left w-2/5">{tournament.maxPlayers}</div>
                    </div>
                    <div id="tournament-general-info-created-by" className="flex">
                        <div className="text-left w-2/5">created by: </div>
                        <div className="w-1/5" />
                        <div className="text-left w-2/5">{tournament.createdByUserName}</div>
                    </div>
                    <div id="tournament-general-info-created-at" className="flex">
                        <div className="text-left w-2/5">created at: </div>
                        <div className="w-1/5" />
                        <div className="text-left w-2/5">{new Date(tournament.createdAt).toLocaleString('nl-NL')}</div>
                    </div>
                    <div id="tournament-general-info-registration-end" className="flex">
                        <div className="text-left w-2/5">registration end: </div>
                        <div className="w-1/5" />
                        <div className="text-left w-2/5">{new Date(tournament.registrationEnd).toLocaleString('nl-NL')}</div>
                    </div>
                </Terminal>
            </div>
            <div id="tournament-general-info-bottom-buffer" className="h-1/10"></div>
        </div>
    )
}

export function TournamentParticipants({ tournamentId }: { tournamentId: string }) {
    const service = useMatchMakingService();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [participants, setParticipants] = useState<IRanking[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        async function getTournamentParticipants() {
            try {
                const result = await service.getTournamentRanking(tournamentId);
                setParticipants(result.data.rankings);
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

    function List(list: IRanking[]) {
        if (!list)
            return

        list.sort(function (a, b) {
            if (a.username > b.username) return 1;
            if (a.username < b.username) return -1;
            return 0;
        });
        const listItems = list.map((item: IRanking) =>
            <li key={item.userId}>
                <div className='flex justify-between' id={'participant-' + item.userId + '-container'}>
                    <button onClick={() => navigate('/profile/' + item.userId)}>
                        {item.username}
                    </button>
                </div>
            </li>
        );
        const chunkSize = 6;
        const listChunks = []
        for (let i = 0; i < listItems.length; i += chunkSize) {
            const chunk = listItems.slice(i, i + chunkSize);
            listChunks.push(
                <div id={`participants-list-chunk-${i}`} className='flex'>
                    <ul>
                        {chunk}
                    </ul>
                    <div id={`participants-space-divider-${i}`} className="p-2"></div >
                </div >
            );
        }

        return (
            <div id="participants-list" className="flex">
                {listChunks}
            </div>
        );
    }
    return (
        <div id='tournament-participants' className="flex flex-col">
            <div className="h-1/10"></div>
            <div className="h-6/10">
                <Terminal title="participants" >
                    {List(participants)}
                </Terminal >
            </div>
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
        const chunkSize = 6;
        const listChunks = []
        for (let i = 0; i < listItems.length; i += chunkSize) {
            const chunk = listItems.slice(i, i + chunkSize);
            listChunks.push(
                <div id={`rankings-list-chunk-${i}`} className='flex'>
                    <ul>
                        {chunk}
                    </ul>
                    <div id={`rankings-space-divider-${i}`} className="p-2"></div >
                </div >
            );
        }

        return (
            <div id="rankings-list" className="flex">
                {listChunks}
            </div>
        );
    }
    return (
        <div id='tournament-rankings' className="flex flex-col">
            <div className="h-1/10"></div>
            <div className="h-6/10">
                <Terminal title="rankings" >
                    {List(rankings)}
                </Terminal >
            </div>
        </div>
    )
}

