"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsMessage = void 0;
const utls_1 = require("./utls");
const verify_human_1 = require("./verify.human");
class WsMessage {
    config;
    MJApi;
    ws;
    closed = false;
    event = [];
    waitMjEvents = new Map();
    skipMessageId = [];
    reconnectTime = [];
    heartbeatInterval = 0;
    UserId = "";
    constructor(config, MJApi) {
        this.config = config;
        this.MJApi = MJApi;
        this.ws = new this.config.WebSocket(this.config.WsBaseUrl);
        this.ws.addEventListener("open", this.open.bind(this));
        this.onSystem("messageCreate", this.onMessageCreate.bind(this));
        this.onSystem("messageUpdate", this.onMessageUpdate.bind(this));
        this.onSystem("ready", this.onReady.bind(this));
        this.onSystem("interactionSuccess", this.onInteractionSuccess.bind(this));
    }
    async heartbeat(num) {
        if (this.reconnectTime[num])
            return;
        //check if ws is closed
        if (this.closed)
            return;
        if (this.ws.readyState !== this.ws.OPEN) {
            this.reconnect();
            return;
        }
        this.heartbeatInterval++;
        this.ws.send(JSON.stringify({
            op: 1,
            d: this.heartbeatInterval,
        }));
        await this.timeout(1000 * 40);
        this.heartbeat(num);
    }
    close() {
        this.closed = true;
        this.ws.close();
    }
    //try reconnect
    reconnect() {
        if (this.closed)
            return;
        this.ws = new this.config.WebSocket(this.config.WsBaseUrl);
        this.heartbeatInterval = 0;
        this.ws.addEventListener("open", this.open.bind(this));
    }
    // After opening ws
    async open() {
        const num = this.reconnectTime.length;
        this.log("open.time", num);
        this.reconnectTime.push(false);
        this.auth();
        this.ws.addEventListener("message", (event) => {
            this.parseMessage(event.data);
        });
        this.ws.addEventListener("error", (event) => {
            this.reconnectTime[num] = true;
            this.reconnect();
        });
        this.ws.addEventListener("close", (event) => {
            this.reconnectTime[num] = true;
            this.reconnect();
        });
        setTimeout(() => {
            this.heartbeat(num);
        }, 1000 * 10);
    }
    // auth
    auth() {
        this.ws.send(JSON.stringify({
            op: 2,
            d: {
                token: this.config.SalaiToken,
                capabilities: 8189,
                properties: {
                    os: "Mac OS X",
                    browser: "Chrome",
                    device: "",
                },
                compress: false,
            },
        }));
    }
    async timeout(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async messageCreate(message) {
        const { embeds, id, nonce, components, attachments } = message;
        if (nonce) {
            // this.log("waiting start image or info or error");
            this.updateMjEventIdByNonce(id, nonce);
            if (embeds?.[0]) {
                const { color, description, title } = embeds[0];
                this.log("embeds[0].color", color);
                switch (color) {
                    case 16711680: //error
                        const error = new Error(description);
                        this.EventError(id, error);
                        return;
                    case 16776960: //warning
                        console.warn(description);
                        break;
                    default:
                        if (title?.includes("continue") &&
                            description?.includes("verify you're human")) {
                            //verify human
                            await this.verifyHuman(message);
                            return;
                        }
                        if (title?.includes("Invalid")) {
                            //error
                            const error = new Error(description);
                            this.EventError(id, error);
                            return;
                        }
                }
            }
        }
        if (!nonce && attachments?.length > 0 && components?.length > 0) {
            this.done(message);
            return;
        }
        this.messageUpdate(message);
    }
    messageUpdate(message) {
        // this.log("messageUpdate", message);
        const { content, embeds, interaction = {}, nonce, id, components, } = message;
        if (!nonce) {
            const { name } = interaction;
            switch (name) {
                case "settings":
                    this.emit("settings", message);
                    return;
                case "describe":
                    this.emitMJ(id, {
                        descriptions: embeds?.[0]?.description.split("\n\n"),
                        options: (0, utls_1.formatOptions)(components),
                    });
                    break;
                case "prefer remix":
                    if (content != "") {
                        this.emit("prefer-remix", content);
                    }
                    break;
                case "shorten":
                    const shorten = {
                        description: embeds?.[0]?.description,
                        prompts: (0, utls_1.formatPrompts)(embeds?.[0]?.description),
                        options: (0, utls_1.formatOptions)(components),
                        id,
                        flags: message.flags,
                    };
                    this.emitMJ(id, shorten);
                    break;
                case "info":
                    this.emit("info", embeds?.[0]?.description);
                    return;
            }
        }
        if (content) {
            this.processingImage(message);
        }
    }
    //interaction success
    async onInteractionSuccess({ nonce, id, }) {
        // this.log("interactionSuccess", nonce, id);
        const event = this.getEventByNonce(nonce);
        if (!event) {
            return;
        }
        event.onmodal && event.onmodal(nonce, id);
    }
    async onReady(user) {
        this.UserId = user.id;
    }
    async onMessageCreate(message) {
        const { channel_id, author, interaction } = message;
        if (channel_id !== this.config.ChannelId)
            return;
        if (author?.id !== this.config.BotId)
            return;
        if (interaction && interaction.user.id !== this.UserId)
            return;
        this.log("[messageCreate]", JSON.stringify(message));
        this.messageCreate(message);
    }
    async onMessageUpdate(message) {
        const { channel_id, author, interaction } = message;
        if (channel_id !== this.config.ChannelId)
            return;
        if (author?.id !== this.config.BotId)
            return;
        if (interaction && interaction.user.id !== this.UserId)
            return;
        this.log("[messageUpdate]", JSON.stringify(message));
        this.messageUpdate(message);
    }
    // parse message from ws
    parseMessage(data) {
        const msg = JSON.parse(data);
        if (!msg.t) {
            return;
        }
        const message = msg.d;
        this.log("message event", msg.t);
        switch (msg.t) {
            case "READY":
                this.emitSystem("ready", message.user);
                break;
            case "MESSAGE_CREATE":
                this.emitSystem("messageCreate", message);
                break;
            case "MESSAGE_UPDATE":
                this.emitSystem("messageUpdate", message);
                break;
            case "INTERACTION_SUCCESS":
                if (message.nonce) {
                    this.emitSystem("interactionSuccess", message);
                }
                break;
            case "INTERACTION_CREATE":
                if (message.nonce) {
                    this.emitSystem("interactionCreate", message);
                }
        }
    }
    async verifyHuman(message) {
        const { HuggingFaceToken } = this.config;
        if (HuggingFaceToken === "" || !HuggingFaceToken) {
            this.log("HuggingFaceToken is empty");
            return;
        }
        const { embeds, components, id, flags } = message;
        const uri = embeds[0].image.url;
        const categories = components[0].components;
        const classify = categories.map((c) => c.label);
        const verifyClient = new verify_human_1.VerifyHuman(this.config);
        const category = await verifyClient.verify(uri, classify);
        if (category) {
            const custom_id = categories.find((c) => c.label === category).custom_id;
            const httpStatus = await this.MJApi.CustomApi({
                msgId: id,
                customId: custom_id,
                flags,
            });
            this.log("verifyHumanApi", httpStatus, custom_id, message.id);
        }
    }
    EventError(id, error) {
        const event = this.getEventById(id);
        if (!event) {
            return;
        }
        const eventMsg = {
            error,
        };
        this.emit(event.nonce, eventMsg);
    }
    done(message) {
        const { content, id, attachments, components, flags } = message;
        const MJmsg = {
            id,
            flags,
            content,
            hash: (0, utls_1.uriToHash)(attachments[0].url),
            progress: "done",
            uri: attachments[0].url,
            proxy_url: attachments[0].proxy_url,
            options: (0, utls_1.formatOptions)(components),
        };
        this.filterMessages(MJmsg);
        return;
    }
    processingImage(message) {
        const { content, id, attachments, flags } = message;
        if (!content) {
            return;
        }
        const event = this.getEventById(id);
        if (!event) {
            return;
        }
        event.prompt = content;
        //not image
        if (!attachments || attachments.length === 0) {
            return;
        }
        const MJmsg = {
            uri: attachments[0].url,
            proxy_url: attachments[0].proxy_url,
            content: content,
            flags: flags,
            progress: (0, utls_1.content2progress)(content),
        };
        const eventMsg = {
            message: MJmsg,
        };
        this.emitImage(event.nonce, eventMsg);
    }
    filterMessages(MJmsg) {
        const event = this.getEventByContent(MJmsg.content);
        if (!event) {
            this.log("FilterMessages not found", MJmsg, this.waitMjEvents);
            return;
        }
        const eventMsg = {
            message: MJmsg,
        };
        this.emitImage(event.nonce, eventMsg);
    }
    getEventByContent(content) {
        const prompt = (0, utls_1.content2prompt)(content);
        for (const [key, value] of this.waitMjEvents.entries()) {
            if (prompt === (0, utls_1.content2prompt)(value.prompt)) {
                return value;
            }
        }
    }
    getEventById(id) {
        for (const [key, value] of this.waitMjEvents.entries()) {
            if (value.id === id) {
                return value;
            }
        }
    }
    getEventByNonce(nonce) {
        for (const [key, value] of this.waitMjEvents.entries()) {
            if (value.nonce === nonce) {
                return value;
            }
        }
    }
    updateMjEventIdByNonce(id, nonce) {
        if (nonce === "" || id === "")
            return;
        let event = this.waitMjEvents.get(nonce);
        if (!event)
            return;
        event.id = id;
        this.log("updateMjEventIdByNonce success", this.waitMjEvents.get(nonce));
    }
    async log(...args) {
        this.config.Debug && console.info(...args, new Date().toISOString());
    }
    emit(event, message) {
        this.event
            .filter((e) => e.event === event)
            .forEach((e) => e.callback(message));
    }
    emitImage(type, message) {
        this.emit(type, message);
    }
    //FIXME: emitMJ rename
    emitMJ(id, data) {
        const event = this.getEventById(id);
        if (!event)
            return;
        this.emit(event.nonce, data);
    }
    on(event, callback) {
        this.event.push({ event, callback });
    }
    onSystem(event, callback) {
        this.on(event, callback);
    }
    emitSystem(type, message) {
        this.emit(type, message);
    }
    once(event, callback) {
        const once = (message) => {
            this.remove(event, once);
            callback(message);
        };
        this.event.push({ event, callback: once });
    }
    remove(event, callback) {
        this.event = this.event.filter((e) => e.event !== event && e.callback !== callback);
    }
    removeEvent(event) {
        this.event = this.event.filter((e) => e.event !== event);
    }
    //FIXME: USE ONCE
    onceInfo(callback) {
        const once = (message) => {
            this.remove("info", once);
            callback(message);
        };
        this.event.push({ event: "info", callback: once });
    }
    //FIXME: USE ONCE
    onceSettings(callback) {
        const once = (message) => {
            this.remove("settings", once);
            callback(message);
        };
        this.event.push({ event: "settings", callback: once });
    }
    onceMJ(nonce, callback) {
        const once = (message) => {
            this.remove(nonce, once);
            //FIXME: removeWaitMjEvent
            this.removeWaitMjEvent(nonce);
            callback(message);
        };
        //FIXME: addWaitMjEvent
        this.waitMjEvents.set(nonce, { nonce });
        this.event.push({ event: nonce, callback: once });
    }
    removeSkipMessageId(messageId) {
        const index = this.skipMessageId.findIndex((id) => id !== messageId);
        if (index !== -1) {
            this.skipMessageId.splice(index, 1);
        }
    }
    removeWaitMjEvent(nonce) {
        this.waitMjEvents.delete(nonce);
    }
    onceImage(nonce, callback) {
        const once = (data) => {
            const { message, error } = data;
            if (error || (message && message.progress === "done")) {
                this.remove(nonce, once);
            }
            callback(data);
        };
        this.event.push({ event: nonce, callback: once });
    }
    async waitImageMessage({ nonce, prompt, onmodal, messageId, loading, }) {
        if (messageId)
            this.skipMessageId.push(messageId);
        return new Promise((resolve, reject) => {
            const handleImageMessage = ({ message, error }) => {
                if (error) {
                    this.removeWaitMjEvent(nonce);
                    reject(error);
                    return;
                }
                if (message && message.progress === "done") {
                    this.removeWaitMjEvent(nonce);
                    messageId && this.removeSkipMessageId(messageId);
                    resolve(message);
                    return;
                }
                message && loading && loading(message.uri, message.progress || "");
            };
            this.waitMjEvents.set(nonce, {
                nonce,
                prompt,
                onmodal: async (nonce, id) => {
                    if (onmodal === undefined) {
                        // reject(new Error("onmodal is not defined"))
                        return "";
                    }
                    var nonce = await onmodal(nonce, id);
                    if (nonce === "") {
                        // reject(new Error("onmodal return empty nonce"))
                        return "";
                    }
                    this.removeWaitMjEvent(nonce);
                    this.waitMjEvents.set(nonce, { nonce });
                    this.onceImage(nonce, handleImageMessage);
                    return nonce;
                },
            });
            this.onceImage(nonce, handleImageMessage);
        });
    }
    async waitDescribe(nonce) {
        return new Promise((resolve) => {
            this.onceMJ(nonce, (message) => {
                resolve(message);
            });
        });
    }
    async waitShorten(nonce) {
        return new Promise((resolve) => {
            this.onceMJ(nonce, (message) => {
                resolve(message);
            });
        });
    }
    async waitContent(event) {
        return new Promise((resolve) => {
            this.once(event, (message) => {
                resolve(message);
            });
        });
    }
    async waitInfo() {
        return new Promise((resolve, reject) => {
            this.onceInfo((message) => {
                resolve((0, utls_1.formatInfo)(message));
            });
        });
    }
    async waitSettings() {
        return new Promise((resolve, reject) => {
            this.onceSettings((message) => {
                resolve({
                    id: message.id,
                    flags: message.flags,
                    content: message,
                    options: (0, utls_1.formatOptions)(message.components),
                });
            });
        });
    }
}
exports.WsMessage = WsMessage;
//# sourceMappingURL=discord.ws.js.map