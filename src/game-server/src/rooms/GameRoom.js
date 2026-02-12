"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.GameRoom = void 0;
var colyseus_1 = require("colyseus");
var GameRoomState_js_1 = require("#schema/GameRoomState.js");
var Create_js_1 = require("#gameEngine/Create.js");
var GameEngine_js_1 = require("#gameEngine/GameEngine.js");
var core_1 = require("@babylonjs/core");
var GameRoom = /** @class */ (function (_super) {
    __extends(GameRoom, _super);
    function GameRoom() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.maxClients = 4;
        _this.state = new GameRoomState_js_1.GameRoomState();
        _this.messages = {
            'set-position': function (client, data) {
                var ball = _this.state.balls.get(client.sessionId);
                ball.x = data._x;
                ball.y = data._y;
                ball.z = data._z;
                console.log(ball);
                // console.log(client.sessionId, 'sent a message:', data);
            }
        };
        return _this;
    }
    GameRoom.prototype.onCreate = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.engine = new GameEngine_js_1.GameEngine();
                        return [4 /*yield*/, this.engine.initGame()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GameRoom.prototype.onJoin = function (client, options) {
        console.log(client.sessionId, 'joined!');
        console.log(this.engine);
        var ball = (0, Create_js_1.createBall)(this.engine.scene, new core_1.Vector3(0, 0, 0), 1);
        ball.lifespan = 1000;
        ball.x = 0;
        ball.y = 0;
        ball.z = 0;
        ball.physicsMesh.aggregate.body.applyForce(new core_1.Vector3(Math.random() * 100, Math.random() * 100, Math.random() * 100), ball.physicsMesh.mesh.absolutePosition);
        console.log('setting ball in state: ', ball);
        this.state.balls.set(client.sessionId, ball);
    };
    GameRoom.prototype.onLeave = function (client, code) {
        /**
         * Called when a client leaves the room.
         */
        console.log(client.sessionId, 'left!', code);
        this.state.balls.delete(client.sessionId);
    };
    GameRoom.prototype.onDispose = function () {
        /**
         * Called when the room is disposed.
         */
        console.log('room', this.roomId, 'disposing...');
    };
    return GameRoom;
}(colyseus_1.Room));
exports.GameRoom = GameRoom;
