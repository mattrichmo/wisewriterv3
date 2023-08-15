"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultMJConfig = exports.NijiBot = exports.MJBot = void 0;
const tslib_1 = require("tslib");
const isomorphic_ws_1 = tslib_1.__importDefault(require("isomorphic-ws"));
exports.MJBot = "936929561302675456";
exports.NijiBot = "1022952195194359889";
exports.DefaultMJConfig = {
    BotId: exports.MJBot,
    ChannelId: "1077800642086703114",
    SalaiToken: "",
    ApiInterval: 350,
    SessionId: "8bb7f5b79c7a49f7d0824ab4b8773a81",
    Debug: false,
    Limit: 50,
    Ws: true,
    MaxWait: 200,
    DiscordBaseUrl: "https://discord.com",
    WsBaseUrl: "wss://gateway.discord.gg?v=9&encoding=json&compress=gzip-stream",
    fetch: fetch,
    WebSocket: isomorphic_ws_1.default,
};
//# sourceMappingURL=config.js.map