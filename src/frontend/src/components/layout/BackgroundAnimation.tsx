
import { JSX } from "react";
import { P5Canvas, Sketch } from "@p5-wrapper/react"
import p5 from 'p5';

(window as any).p5 = p5;
//
// let xScale = 0.015;
// let yScale = 0.02;
//
// let gapSlider;
// let gap;
// let offsetSlider;
// let offset;
// let t;
// let networkGrid = new Array();
// let nodes = [];
//
// function setup() {
//   createCanvas(800, 800);
//   t = 0;
//   t2 = 0;
//   background(100);
//   gap = 10
//   let xIndex = 0;
//   let yIndex = 0;
//   for (let x = - 200; x < width + 200; x += 100) {
//     networkGrid[xIndex] = new Array();
//     yIndex= 0;
//     for (let y = -200; y < height + 200; y += 100) {
//       const randomXOffset = random(-50,50);
//       const randomYOffset = random(-50,50);
//       fill(255, 0, 0);
//       const diameter = 1 * gap;
//       const posX = x + randomXOffset
//       const posY = y + randomYOffset
//       networkGrid[xIndex].push(createVector(posX, posY));
//       yIndex++;
//     }
//     xIndex++;
//   }
//
// }
//
// function draw(){
//   t += 1;
//   t2+= 0.01
//   
//   const fillValue = map(sin(t2), -1, 1, 0,255)
//   
//   const fillValueInverse =  map(fillValue, 0, 255, 255,0)
//   
//   fill(fillValueInverse , fillValue / 2, fillValue / 2)
//   stroke(fillValue, fillValue / 2, fillValue / 2);
//   
//   dotGrid();
//   
//   for (let x = 1; x < networkGrid.length - 1; x++){
//     for (let y = 1; y < networkGrid[x].length -1 ; y++){ 
//       fill(fillValue, fillValue / 2, fillValue / 2)
//       stroke(fillValue, fillValue / 2, fillValue / 2);
//        line(networkGrid[x][y].x, networkGrid[x][y].y,networkGrid[x+1][y].x, networkGrid[x+1][y].y)  
//       line(networkGrid[x][y].x, networkGrid[x][y].y,networkGrid[x][y+1].x, networkGrid[x][y+1].y)  
//     }
//   }
//   
//   if (!(frameCount % 5)){
//     const originX = floor(random(2, networkGrid.length - 1));
//     const originY = floor(random(2, networkGrid[1].length - 1))
//     const dirFlip = floor(random(0, 4));
//     
//     if (dirFlip === 0){
//           nodes.push(new Node(networkGrid[originX][originY], networkGrid[originX - 1][originY]));  
//     } else if (dirFlip === 1){
//          nodes.push(new Node(networkGrid[originX][originY], networkGrid[originX + 1][originY]));
//     }else if (dirFlip === 2){
//          nodes.push(new Node(networkGrid[originX][originY], networkGrid[originX][originY - 1]));
//     }else if (dirFlip === 3){
//          nodes.push(new Node(networkGrid[originX][originY], networkGrid[originX][originY + 1]));
//     }
//   }
//   
//   nodes = nodes.filter((node)=>!node.isDead());
//   
//   for (const node of nodes){
//     // fill(fillValue);
//     noStroke();
//     node.update();
//     node.draw();
//   }
//  
// }
//
// class Node {
//   constructor(origin, destination){
//     this.origin = origin.copy();
//     this.position = origin.copy();
//     this.destination = destination.copy()
//     this.direction = p5.Vector.sub(this.destination,this.origin).div(40);
//     
//     this.dead = false
//   }
//   
//   update(){
//     this.position.add(this.direction);
//
//     if (p5.Vector.dist(this.origin, this.position) > p5.Vector.dist(this.origin, this.destination)){
//       this.dead = true;
//     }
//   }
//   
//   draw(){
//     circle(this.position.x, this.position.y, 5);
//   }
//   
//   isDead(){
//     return (this.dead);
//   }
// }
//
//
// function dotGrid() {
//   background(0);
//   noStroke();
//
//   // Get the current gap and offset values from the sliders
//   offset = t;
//
//   // Loop through x and y coordinates, at increments set by gap
//   for (let x = gap / 2; x < width; x += gap) {
//     for (let y = gap / 2; y < height; y += gap) {
//       // Calculate noise value using scaled and offset coordinates
//       let noiseValue = noise((x + offset) * xScale, (y + offset) * yScale);
//
//       // Since noiseValue will be 0-1, multiply it by gap to set diameter to
//       // between 0 and the size of the gap between circles
//       let diameter = noiseValue * gap;
//       circle(x, y, diameter);
//     }
//   }
// }
export function BackgroundAnimation(): JSX.Element {

    const sketch: Sketch = p5 => {
        const divName = "bg-home-animation"

        p5.setup = () => {
            const sketchWidth = document.getElementById(divName)?.offsetWidth ?? 1420;
            const sketchHeight = document.getElementById(divName)?.offsetHeight ?? 1080;
            const renderer = p5.createCanvas(sketchWidth, sketchHeight, p5.WEBGL);
            renderer.parent(divName);

            p5.textSize(p5.width / 100);
            p5.pixelDensity(window.devicePixelRatio);


        };

        p5.draw = () => {
            p5.background(100);
        };

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
