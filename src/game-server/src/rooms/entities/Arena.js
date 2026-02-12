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
exports.Arena = void 0;
var core_1 = require("@babylonjs/core");
/* v8 ignore start */
var Arena = /** @class */ (function () {
    function Arena() {
    }
    Arena.prototype.initMesh = function (scene) {
        return __awaiter(this, void 0, void 0, function () {
            var model;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        model = (0, core_1.ImportMeshAsync)('#public/arena.gltf', scene);
                        return [4 /*yield*/, model
                                .then(function (result) {
                                if (result.meshes.length !== 4)
                                    throw Error('invalid format');
                                for (var _i = 0, _a = result.meshes; _i < _a.length; _i++) {
                                    var index = _a[_i];
                                    var mesh = index;
                                    if (mesh.id === '__root__')
                                        continue;
                                    if (mesh.id === 'arena') {
                                        mesh.flipFaces(true);
                                    }
                                    var material = new core_1.StandardMaterial('wireframe', scene);
                                    material.wireframe = true;
                                    mesh.material = material;
                                    if (mesh.material) {
                                        mesh.material.wireframe = true;
                                    }
                                    var aggregate = new core_1.PhysicsAggregate(mesh, core_1.PhysicsShapeType.MESH, { mass: 0.0, restitution: 1.0, friction: 0.0 }, scene);
                                    aggregate.body.setAngularDamping(0.0);
                                    aggregate.body.setLinearDamping(0.0);
                                    if (mesh.id === 'arena') {
                                        _this._arena = { mesh: mesh, aggregate: aggregate };
                                    }
                                    else if (mesh.id === 'goal_1') {
                                        aggregate.body.setCollisionCallbackEnabled(true);
                                        _this.goal_1 = { mesh: mesh, aggregate: aggregate };
                                    }
                                    else if (mesh.id === 'goal_2') {
                                        aggregate.body.setCollisionCallbackEnabled(true);
                                        _this.goal_2 = { mesh: mesh, aggregate: aggregate };
                                    }
                                }
                            })
                                .catch(function (error) {
                                console.error('failed to import arena mesh');
                                console.error(error);
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Object.defineProperty(Arena.prototype, "arena", {
        get: function () {
            return this._arena;
        },
        set: function (value) {
            this._arena = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Arena.prototype, "goal_1", {
        get: function () {
            return this._goal_1;
        },
        set: function (value) {
            this._goal_1 = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Arena.prototype, "goal_2", {
        get: function () {
            return this._goal_2;
        },
        set: function (value) {
            this._goal_2 = value;
        },
        enumerable: false,
        configurable: true
    });
    return Arena;
}());
exports.Arena = Arena;
/* v8 ignore stop */
