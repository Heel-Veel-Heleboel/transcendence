"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEngine = void 0;
var Physics_js_1 = require("#gameEngine/Physics.js");
var Render_js_1 = require("#gameEngine/Render.js");
var Create_js_1 = require("#gameEngine/Create.js");
var core_1 = require("@babylonjs/core");
var GameEngine = /** @class */ (function () {
    function GameEngine() {
    }
    GameEngine.prototype.initGame = function () {
        return __awaiter(this, void 0, void 0, function () {
            var scene, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.engine = new core_1.NullEngine();
                        scene = new core_1.Scene(this.engine);
                        return [4 /*yield*/, (0, Physics_js_1.initializePhysics)(scene)];
                    case 1:
                        _b.sent();
                        _a = this;
                        return [4 /*yield*/, this.initScene(scene)];
                    case 2:
                        _a.scene = _b.sent();
                        (0, Render_js_1.renderLoop)(this.engine, this.scene);
                        return [2 /*return*/];
                }
            });
        });
    };
    /* v8 ignore start */
    GameEngine.prototype.initScene = function (scene) {
        return __awaiter(this, void 0, void 0, function () {
            var observable_1, observable_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.camera = (0, Create_js_1.createCamera)(scene, 40);
                        this.light = (0, Create_js_1.createLight)(scene);
                        this.arena = (0, Create_js_1.createArena)();
                        return [4 /*yield*/, this.arena.initMesh(scene)];
                    case 1:
                        _a.sent();
                        console.log(this.arena);
                        observable_1 = this.arena.goal_1.aggregate.body.getCollisionObservable();
                        observable_1.add(function (_collisionEvent) {
                            console.log('goal_1');
                        });
                        observable_2 = this.arena.goal_2.aggregate.body.getCollisionObservable();
                        observable_2.add(function (_collisionEvent) {
                            console.log('goal_2');
                        });
                        // NOTE: next lines probably not needed in server
                        // scene.onBeforeRenderObservable.add(this.draw(this));
                        // for hit indicator
                        // scene.getBoundingBoxRenderer().frontColor.set(1, 0, 0);
                        // scene.getBoundingBoxRenderer().backColor.set(0, 1, 0);
                        return [2 /*return*/, scene];
                }
            });
        });
    };
    Object.defineProperty(GameEngine.prototype, "defaultScene", {
        get: function () {
            return this._defaultScene;
        },
        /* v8 ignore start */
        set: function (defaultScene) {
            this._defaultScene = defaultScene;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GameEngine.prototype, "scene", {
        get: function () {
            return this._scene;
        },
        set: function (scene) {
            this._scene = scene;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GameEngine.prototype, "engine", {
        get: function () {
            return this._engine;
        },
        set: function (engine) {
            this._engine = engine;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GameEngine.prototype, "arena", {
        get: function () {
            return this._arena;
        },
        set: function (arena) {
            this._arena = arena;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GameEngine.prototype, "balls", {
        // get player(): Player {
        //   return this._player;
        // }
        get: function () {
            return this._balls;
        },
        // set player(player: Player) {
        //   this._player = player;
        // }
        set: function (balls) {
            this._balls = balls;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GameEngine.prototype, "camera", {
        get: function () {
            return this._camera;
        },
        set: function (camera) {
            this._camera = camera;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GameEngine.prototype, "light", {
        get: function () {
            return this._light;
        },
        set: function (light) {
            this._light = light;
        },
        enumerable: false,
        configurable: true
    });
    return GameEngine;
}());
exports.GameEngine = GameEngine;
