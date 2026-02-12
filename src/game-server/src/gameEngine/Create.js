"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCamera = createCamera;
exports.createArena = createArena;
exports.createBall = createBall;
exports.createLight = createLight;
var core_1 = require("@babylonjs/core");
var Ball_js_1 = require("#entities/Ball.js");
var Arena_js_1 = require("#entities/Arena.js");
function createCamera(scene, distance) {
    var camera = new core_1.ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2, distance, core_1.Vector3.Zero(), scene);
    camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
    return camera;
}
function createArena() {
    var arena = new Arena_js_1.Arena();
    return arena;
}
function createBall(scene, pos, diameter) {
    console.log(scene);
    console.log(pos);
    console.log(diameter);
    var _ball = core_1.MeshBuilder.CreateSphere('ball', {
        diameter: diameter
    }, scene);
    var ball = new Ball_js_1.Ball(_ball, pos, scene);
    return ball;
}
function createLight(scene) {
    var light = new core_1.HemisphericLight('hemiLight', new core_1.Vector3(-1, 1, 0), scene);
    light.diffuse = new core_1.Color3(1, 0, 0);
    light.specular = new core_1.Color3(0, 1, 0);
    light.groundColor = new core_1.Color3(0, 1, 0);
    return light;
}
