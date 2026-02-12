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
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ball = void 0;
var schema_1 = require("@colyseus/schema");
var core_1 = require("@babylonjs/core");
/* v8 ignore start */
var Ball = function () {
    var _a;
    var _classSuper = schema_1.Schema;
    var _lifespan_decorators;
    var _lifespan_initializers = [];
    var _lifespan_extraInitializers = [];
    var _x_decorators;
    var _x_initializers = [];
    var _x_extraInitializers = [];
    var _y_decorators;
    var _y_initializers = [];
    var _y_extraInitializers = [];
    var _z_decorators;
    var _z_initializers = [];
    var _z_extraInitializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(Ball, _super);
            function Ball(ball, position, scene) {
                var _this = _super.call(this) || this;
                _this.lifespan = __runInitializers(_this, _lifespan_initializers, void 0);
                _this.x = (__runInitializers(_this, _lifespan_extraInitializers), __runInitializers(_this, _x_initializers, void 0));
                _this.y = (__runInitializers(_this, _x_extraInitializers), __runInitializers(_this, _y_initializers, void 0));
                _this.z = (__runInitializers(_this, _y_extraInitializers), __runInitializers(_this, _z_initializers, void 0));
                _this.physicsMesh = __runInitializers(_this, _z_extraInitializers);
                var mesh = ball;
                mesh.position = position;
                var aggregate = new core_1.PhysicsAggregate(mesh, core_1.PhysicsShapeType.SPHERE, { mass: 0.1, restitution: 1.023, friction: 0.0 }, scene);
                aggregate.body.setAngularDamping(0.0);
                aggregate.body.setLinearDamping(0.0);
                _this.physicsMesh = { mesh: mesh, aggregate: aggregate };
                _this.lifespan = 1000;
                return _this;
            }
            Ball.prototype.setPosition = function (pos) {
                this.x = pos._x;
                this.y = pos._y;
                this.z = pos._z;
            };
            Ball.prototype.isDead = function () {
                var dead = this.lifespan < 0.0;
                if (dead) {
                    this.dispose();
                }
                return dead;
            };
            Ball.prototype.dispose = function () {
                this.physicsMesh.mesh.dispose();
                this.physicsMesh.aggregate.dispose();
            };
            Ball.prototype.update = function () {
                this.lifespan = this.lifespan - 1;
            };
            return Ball;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _lifespan_decorators = [(0, schema_1.type)('number')];
            _x_decorators = [(0, schema_1.type)('number')];
            _y_decorators = [(0, schema_1.type)('number')];
            _z_decorators = [(0, schema_1.type)('number')];
            __esDecorate(null, null, _lifespan_decorators, { kind: "field", name: "lifespan", static: false, private: false, access: { has: function (obj) { return "lifespan" in obj; }, get: function (obj) { return obj.lifespan; }, set: function (obj, value) { obj.lifespan = value; } }, metadata: _metadata }, _lifespan_initializers, _lifespan_extraInitializers);
            __esDecorate(null, null, _x_decorators, { kind: "field", name: "x", static: false, private: false, access: { has: function (obj) { return "x" in obj; }, get: function (obj) { return obj.x; }, set: function (obj, value) { obj.x = value; } }, metadata: _metadata }, _x_initializers, _x_extraInitializers);
            __esDecorate(null, null, _y_decorators, { kind: "field", name: "y", static: false, private: false, access: { has: function (obj) { return "y" in obj; }, get: function (obj) { return obj.y; }, set: function (obj, value) { obj.y = value; } }, metadata: _metadata }, _y_initializers, _y_extraInitializers);
            __esDecorate(null, null, _z_decorators, { kind: "field", name: "z", static: false, private: false, access: { has: function (obj) { return "z" in obj; }, get: function (obj) { return obj.z; }, set: function (obj, value) { obj.z = value; } }, metadata: _metadata }, _z_initializers, _z_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.Ball = Ball;
/* v8 ignore stop */
