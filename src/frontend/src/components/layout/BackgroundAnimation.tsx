
import { JSX } from "react";
import { P5Canvas, Sketch } from "@p5-wrapper/react"
import p5 from 'p5';

(window as any).p5 = p5;
//
export function BackgroundAnimation(): JSX.Element {

    const sketch: Sketch = p5 => {
        const divName = "bg-home-animation"

        let xScale = 0.015;
        let yScale = 0.02;

        let gap: number;
        let offset;
        let t: number;
        let t2: number;
        let networkGrid = new Array();
        let nodes = new Array<Node>();

        p5.setup = () => {
            const sketchWidth = document.getElementById(divName)?.offsetWidth ?? 1420;
            const sketchHeight = document.getElementById(divName)?.offsetHeight ?? 1080;
            const renderer = p5.createCanvas(sketchWidth, sketchHeight);
            renderer.parent(divName);

            p5.textSize(p5.width / 100);
            p5.pixelDensity(window.devicePixelRatio);

            t = 0;
            t2 = 0;
            p5.background(100);
            gap = 10
            let xIndex = 0;
            let yIndex = 0;
            for (let x = - 200; x < p5.width + 200; x += 100) {
                networkGrid[xIndex] = new Array();
                yIndex = 0;
                for (let y = -200; y < p5.height + 200; y += 100) {
                    p5.fill(255, 0, 0);
                    networkGrid[xIndex].push(p5.createVector(x, y));
                    yIndex++;
                }
                xIndex++;
            }

        }

        p5.draw = () => {
            t += 1;
            t2 += 0.01

            const fillValue = p5.map(p5.sin(t2), -1, 1, 0, 255)

            const fillValueInverse = p5.map(fillValue, 0, 255, 255, 0)

            p5.fill(fillValueInverse, fillValue / 2, fillValue / 2)
            p5.stroke(fillValue, fillValue / 2, fillValue / 2);

            dotGrid();

            for (let x = 1; x < networkGrid.length - 1; x++) {
                for (let y = 1; y < networkGrid[x].length - 1; y++) {
                    p5.fill(fillValue, 0, 0)
                    p5.stroke(fillValue, 0, fillValue / 2);
                    p5.line(networkGrid[x][y].x, networkGrid[x][y].y, networkGrid[x + 1][y].x, networkGrid[x + 1][y].y)
                    p5.line(networkGrid[x][y].x, networkGrid[x][y].y, networkGrid[x][y + 1].x, networkGrid[x][y + 1].y)
                }
            }
            //   
            if (!(p5.frameCount % 5)) {
                const originX = p5.floor(p5.random(2, networkGrid.length - 1));
                const originY = p5.floor(p5.random(2, networkGrid[1].length - 1))
                const dirFlip = p5.floor(p5.random(0, 4));

                if (dirFlip === 0) {
                    nodes.push(new Node(networkGrid[originX][originY], networkGrid[originX - 1][originY]));
                } else if (dirFlip === 1) {
                    nodes.push(new Node(networkGrid[originX][originY], networkGrid[originX + 1][originY]));
                } else if (dirFlip === 2) {
                    nodes.push(new Node(networkGrid[originX][originY], networkGrid[originX][originY - 1]));
                } else if (dirFlip === 3) {
                    nodes.push(new Node(networkGrid[originX][originY], networkGrid[originX][originY + 1]));
                }
            }

            nodes = nodes.filter((node: Node) => !node.isDead());

            for (const node of nodes) {
                p5.noStroke();
                node.update();
                node.draw();
            }

        }
        //
        class Node {
            public origin: p5.Vector
            public position: p5.Vector
            public destination: p5.Vector
            public direction: p5.Vector
            public dead: boolean

            constructor(origin: p5.Vector, destination: p5.Vector) {
                this.origin = origin.copy();
                this.position = origin.copy();
                this.destination = destination.copy()
                this.direction = p5.constructor.Vector.sub(this.destination, this.origin).div(40);

                this.dead = false
            }

            update() {
                this.position.add(this.direction);

                if (p5.constructor.Vector.dist(this.origin, this.position) > p5.constructor.Vector.dist(this.origin, this.destination)) {
                    this.dead = true;
                }
            }

            draw() {
                p5.circle(this.position.x, this.position.y, 5);
            }

            isDead() {
                return (this.dead);
            }
        }


        function dotGrid() {
            p5.background(0);
            p5.noStroke();

            offset = t;

            for (let x = gap / 2; x < p5.width; x += gap) {
                for (let y = gap / 2; y < p5.height; y += gap) {
                    let noiseValue = p5.noise((x + offset) * xScale, (y + offset) * yScale);

                    let diameter = noiseValue * gap;
                    p5.circle(x, y, diameter);
                }
            }
        }




        p5.windowResized = () => {
            p5.setup();
        }

    }

    function renderAnimation() {
        return <P5Canvas sketch={sketch} />;
    }

    return (
        <div id="bg-home-animation" className="fixed right-0 bottom-0 min-w-full min-h-full -z-1 object-cover" >
            {renderAnimation()}
        </div>
    )
}
