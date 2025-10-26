"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("../../src/api-gateway/index");
(0, vitest_1.describe)('API Gateway', () => {
    let app;
    (0, vitest_1.beforeEach)(async () => {
        // Use your actual server creation function
        app = (0, index_1.createServer)();
        await app.ready();
    });
    (0, vitest_1.afterEach)(async () => {
        if (app) {
            await app.close();
        }
    });
    (0, vitest_1.describe)('Health Check', () => {
        (0, vitest_1.it)('should return healthy status', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/health'
            });
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const body = response.json();
            (0, vitest_1.expect)(body).toMatchObject({
                status: 'healthy'
            });
            (0, vitest_1.expect)(body).toHaveProperty('timestamp');
            (0, vitest_1.expect)(typeof body.timestamp).toBe('string');
        });
    });
    (0, vitest_1.describe)('Route Registration', () => {
        (0, vitest_1.it)('should register health route', () => {
            const routes = app.printRoutes();
            (0, vitest_1.expect)(routes).toContain('health');
        });
        (0, vitest_1.it)('should register proxy route', () => {
            const routes = app.printRoutes();
            (0, vitest_1.expect)(routes).toContain('api/test');
        });
        (0, vitest_1.it)('should have both routes registered', () => {
            const routes = app.printRoutes();
            (0, vitest_1.expect)(routes).toContain('health (GET, HEAD)');
            (0, vitest_1.expect)(routes).toContain('api/test');
        });
    });
});
//# sourceMappingURL=index.test.js.map