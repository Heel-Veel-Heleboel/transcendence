"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * IMPORTANT:
 * ---------
 * Do not manually edit this file if you'd like to host your server on Colyseus Cloud
 *
 * If you're self-hosting, you can see "Raw usage" from the documentation.
 *
 * See: https://docs.colyseus.io/server
 */
var tools_1 = require("@colyseus/tools");
// Import Colyseus config
var app_config_js_1 = require("./app.config.js");
// Create and listen on 2567 (or PORT environment variable.)
(0, tools_1.listen)(app_config_js_1.default);
