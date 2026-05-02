import { JSX } from "react";
import { P5Canvas, Sketch } from "@p5-wrapper/react"
import p5 from 'p5';

(window as any).p5 = p5;

export function NotFound(): JSX.Element {

    const sketch: Sketch = p5 => {
        let systemX: System;
        let systemY: System;
        let angleX = 0;
        let angleY = 0;
        let displaceColors: p5.Shader;
        let r = 200;
        let g = 100;
        let b = 100;
        let deltaR: number;
        let deltaG: number;
        let deltaB: number;
        let displaceColorsSrc = `
precision highp float;

uniform sampler2D tex0;
varying vec2 vTexCoord;

vec2 zoom(vec2 coord, float amount) {
  vec2 relativeToCenter = coord - 0.5;
  relativeToCenter /= amount; // Zoom in
  return relativeToCenter + 0.55; // Put back into absolute coordinates
}

void main() {
  // Get each color channel using coordinates with different amounts
  // of zooms to displace the colors slightly
  gl_FragColor = vec4(
    texture2D(tex0, zoom(vTexCoord, 1.8)).r,
    texture2D(tex0, zoom(vTexCoord, 1.35)).g,
    texture2D(tex0, zoom(vTexCoord, 1.3)).b,
    texture2D(tex0, zoom(vTexCoord, 0.6)).a
  );
}
`;
        const divName = "not-found-animation"

        p5.setup = async () => {
            const sketchWidth = document.getElementById(divName)?.offsetWidth ?? 1420;
            const sketchHeight = document.getElementById(divName)?.offsetHeight ?? 1080;
            const renderer = p5.createCanvas(sketchWidth, sketchHeight, p5.WEBGL);
            renderer.parent(divName);

            p5.textSize(sketchWidth / 50);
            p5.pixelDensity(window.devicePixelRatio);

            const font = await p5.loadFont('/anima.otf');
            displaceColors = p5.createFilterShader(displaceColorsSrc);
            systemX = new System(10);
            systemY = new System(10);
            deltaR = 0.025;
            deltaG = 0.01;
            deltaB = 0.07;
            p5.textFont(font);
        };

        p5.draw = () => {
            p5.background(r, g, b);


            r += deltaR;
            g += deltaG;
            b += deltaB;
            p5.rotateX(angleX);
            p5.rotateY(angleY * 1.1);
            systemX.seek(p5.createVector(p5.map(p5.sin(angleX), -1, 1, -p5.width / 2, p5.width / 2), p5.map(p5.cos(angleY), -1, 1, -p5.width / 2, p5.height)));
            systemX.run();
            p5.push();
            p5.rotateX(p5.HALF_PI);
            systemY.seek(p5.createVector(p5.map(p5.sin(angleX), -1, 1, -p5.width / 2, p5.width / 2), p5.map(p5.cos(angleY), -1, 1, -p5.width / 2, p5.height)));
            systemY.run();
            p5.pop();
            // p5.filter(displaceColors);
            angleX += 0.01;
            angleY += 0.01;
        };

        p5.windowResized = () => {
            p5.setup();
        }

        class Vehicle {
            public position: p5.Vector
            public velocity: p5.Vector
            public acceleration: p5.Vector
            public r: number;
            public maxForce: number;
            public maxSpeed: number;
            public lifespan: number;
            public angle: number
            public red: number
            public green: number
            public blue: number
            public text: string

            constructor(x: number, y: number, r: number, red: number, green: number, blue: number) {
                this.position = p5.createVector(x, y, 0);
                this.velocity = p5.createVector(0, 0, 0);
                this.acceleration = p5.createVector(0, 0, 0);
                this.r = r;
                this.maxForce = 0.2;
                this.maxSpeed = 8;
                this.lifespan = 255;
                this.angle = 0;
                this.red = red;
                this.green = green;
                this.blue = blue;
                this.text = Math.random() > 0.5 ? '404' : 'not found';
            }

            update() {
                this.velocity.add(this.acceleration);
                this.velocity.limit(this.maxSpeed);
                this.position.add(this.velocity);
                this.acceleration.mult(0);
                this.lifespan -= 2;
                this.angle += 0.1;
            }

            show() {
                p5.fill(255 % this.red + this.angle, 255 % this.green + this.angle, 255 % this.blue + this.angle, this.lifespan);
                p5.push();
                p5.translate(this.position.x, this.position.y, this.angle % p5.width);
                p5.text(this.text, 0, 0);
                p5.pop();
            }

            run(vehicles: Vehicle[]) {
                this.cohere(vehicles);
                this.update();
                this.show();
            }

            applyForce(force: p5.Vector) {
                this.acceleration.add(force);
            }


            seek(target: p5.Vector) {
                let desired = p5.constructor.Vector.sub(target, this.position);
                desired.limit(this.maxSpeed);
                let steer = p5.constructor.Vector.sub(desired, this.velocity);
                steer.limit(this.maxForce);
                this.applyForce(steer);
            }

            cohere(vehicles: Vehicle[]) {
                let desiredDistance = this.r * 2;
                let sum = p5.createVector(0, 0, 0);
                let count = 0;
                for (let other of vehicles) {
                    let d = p5.constructor.Vector.dist(this.position, other.position);
                    if (this !== other && d > desiredDistance) {
                        let diff = p5.constructor.Vector.sub(this.position, other.position);
                        // diff.setMag(1 / d);
                        sum.add(diff);
                        count++;
                    }
                }
                if (count > 0) {
                    this.seek(sum.div(count));
                }
            }
        }

        class System {

            public n: number
            public origin: p5.Vector[];
            public vehicles: Vehicle[];

            constructor(n: number) {
                this.n = n
                this.origin = [];
                for (let i = 0; i < n; i++) {
                    this.origin.push(p5.createVector(p5.random(-p5.width / 2, p5.width / 2), p5.random(-p5.height / 2, p5.height / 2)));
                }
                this.vehicles = [];
            }

            addVehicle() {
                let origin = this.origin[p5.floor(p5.random(this.n))];
                this.vehicles.push(new Vehicle(origin.x, origin.y, p5.random(100), p5.random(255), p5.random(255), p5.random(120)));
            }

            seek(target: p5.Vector) {
                for (let vehicle of this.vehicles) {
                    vehicle.seek(target);
                }
            }

            run() {
                for (let vehicle of this.vehicles) {
                    vehicle.run(this.vehicles);
                }

                if (!(p5.frameCount % 10)) {
                    this.addVehicle();
                }
                this.vehicles = this.vehicles.filter((vehicle) => vehicle.lifespan > 0);
            }
        }
    }

    function renderAnimation() {
        return <P5Canvas sketch={sketch} />;
    }

    return (
        <div id="not-found-animation" className="fixed right-0 bottom-0 min-w-full min-h-full -z-1 object-cover" >
            {renderAnimation()}
        </div>
    )
}
