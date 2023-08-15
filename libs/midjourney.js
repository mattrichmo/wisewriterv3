"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Midjourney = void 0;
const interfaces_1 = require("./interfaces");
const midjourne_api_1 = require("./midjourne.api");
const discord_message_1 = require("./discord.message");
const utls_1 = require("./utls");
const discord_ws_1 = require("./discord.ws");
class Midjourney extends discord_message_1.MidjourneyMessage {
    config;
    wsClient;
    MJApi;
    constructor(defaults) {
        const { SalaiToken } = defaults;
        if (!SalaiToken) {
            throw new Error("SalaiToken are required");
        }
        super(defaults);
        this.config = {
            ...interfaces_1.DefaultMJConfig,
            ...defaults,
        };
        this.MJApi = new midjourne_api_1.MidjourneyApi(this.config);
    }
    async Connect() {
        if (!this.config.Ws) {
            return this;
        }
        //if auth failed, will throw error
        if (this.config.ServerId) {
            await this.MJApi.getCommand("settings");
        }
        else {
            await this.MJApi.allCommand();
        }
        if (this.wsClient)
            return this;
        return new Promise((resolve) => {
            this.wsClient = new discord_ws_1.WsMessage(this.config, this.MJApi);
            this.wsClient.once("ready", (user) => {
                //print user nickname
                console.log(`🎊 ws ready!!! Hi: ${user.global_name}`);
                resolve(this);
            });
        });
    }
    async init() {
        await this.Connect();
        const settings = await this.Settings();
        if (settings) {
            // this.log(`settings:`, settings.content);
            const remix = settings.options.find((o) => o.label === "Remix mode");
            if (remix?.style == 3) {
                this.config.Remix = true;
                this.log(`Remix mode enabled`);
            }
        }
        return this;
    }
    async Imagine(prompt, loading) {
        prompt = prompt.trim();
        if (!this.config.Ws) {
            const seed = (0, utls_1.random)(1000000000, 9999999999);
            prompt = `[${seed}] ${prompt}`;
        }
        const nonce = (0, utls_1.nextNonce)();
        this.log(`Imagine`, prompt, "nonce", nonce);
        const httpStatus = await this.MJApi.ImagineApi(prompt, nonce);
        if (httpStatus !== 204) {
            throw new Error(`ImagineApi failed with status ${httpStatus}`);
        }
        if (this.config.Ws) {
            const wsClient = await this.getWsClient();
            return await wsClient.waitImageMessage({ nonce, loading, prompt });
        }
        else {
            this.log(`await generate image`);
            const msg = await this.WaitMessage(prompt, loading);
            this.log(`image generated`, prompt, msg?.uri);
            return msg;
        }
    }
    // check ws enabled && connect
    async getWsClient() {
        if (!this.config.Ws) {
            throw new Error(`ws not enabled`);
        }
        if (!this.wsClient) {
            await this.Connect();
        }
        if (!this.wsClient) {
            throw new Error(`ws not connected`);
        }
        return this.wsClient;
    }
    async Settings() {
        const wsClient = await this.getWsClient();
        const nonce = (0, utls_1.nextNonce)();
        const httpStatus = await this.MJApi.SettingsApi(nonce);
        if (httpStatus !== 204) {
            throw new Error(`ImagineApi failed with status ${httpStatus}`);
        }
        return wsClient.waitSettings();
    }
    async Reset() {
        const settings = await this.Settings();
        if (!settings) {
            throw new Error(`Settings not found`);
        }
        const reset = settings.options.find((o) => o.label === "Reset Settings");
        if (!reset) {
            throw new Error(`Reset Settings not found`);
        }
        const httpstatus = await this.MJApi.CustomApi({
            msgId: settings.id,
            customId: reset.custom,
            flags: settings.flags,
        });
        if (httpstatus !== 204) {
            throw new Error(`Reset failed with status ${httpstatus}`);
        }
    }
    async Info() {
        const wsClient = await this.getWsClient();
        const nonce = (0, utls_1.nextNonce)();
        const httpStatus = await this.MJApi.InfoApi(nonce);
        if (httpStatus !== 204) {
            throw new Error(`InfoApi failed with status ${httpStatus}`);
        }
        return wsClient.waitInfo();
    }
    async Fast() {
        const nonce = (0, utls_1.nextNonce)();
        const httpStatus = await this.MJApi.FastApi(nonce);
        if (httpStatus !== 204) {
            throw new Error(`FastApi failed with status ${httpStatus}`);
        }
        return null;
    }
    async Relax() {
        const nonce = (0, utls_1.nextNonce)();
        const httpStatus = await this.MJApi.RelaxApi(nonce);
        if (httpStatus !== 204) {
            throw new Error(`RelaxApi failed with status ${httpStatus}`);
        }
        return null;
    }
    async SwitchRemix() {
        const wsClient = await this.getWsClient();
        const nonce = (0, utls_1.nextNonce)();
        const httpStatus = await this.MJApi.SwitchRemixApi(nonce);
        if (httpStatus !== 204) {
            throw new Error(`RelaxApi failed with status ${httpStatus}`);
        }
        return wsClient.waitContent("prefer-remix");
    }
    async Describe(imgUri) {
        const wsClient = await this.getWsClient();
        const nonce = (0, utls_1.nextNonce)();
        const DcImage = await this.MJApi.UploadImageByUri(imgUri);
        const httpStatus = await this.MJApi.DescribeApi(DcImage, nonce);
        if (httpStatus !== 204) {
            throw new Error(`DescribeApi failed with status ${httpStatus}`);
        }
        return wsClient.waitDescribe(nonce);
    }
    async Shorten(prompt) {
        const wsClient = await this.getWsClient();
        const nonce = (0, utls_1.nextNonce)();
        const httpStatus = await this.MJApi.ShortenApi(prompt, nonce);
        if (httpStatus !== 204) {
            throw new Error(`ShortenApi failed with status ${httpStatus}`);
        }
        return wsClient.waitShorten(nonce);
    }
    async Variation({ index, msgId, hash, content, flags, loading, }) {
        return await this.Custom({
            customId: `MJ::JOB::variation::${index}::${hash}`,
            msgId,
            content,
            flags,
            loading,
        });
    }
    async Upscale({ index, msgId, hash, content, flags, loading, }) {
        return await this.Custom({
            customId: `MJ::JOB::upsample::${index}::${hash}`,
            msgId,
            content,
            flags,
            loading,
        });
    }
    async Custom({ msgId, customId, content, flags, loading, }) {
        const nonce = (0, utls_1.nextNonce)();
        const httpStatus = await this.MJApi.CustomApi({
            msgId,
            customId,
            flags,
            nonce,
        });
        if (httpStatus !== 204) {
            throw new Error(`CustomApi failed with status ${httpStatus}`);
        }
        if (this.config.Ws) {
            const wsClient = await this.getWsClient();
            return await wsClient.waitImageMessage({
                nonce,
                loading,
                messageId: msgId,
                prompt: content,
                onmodal: async (nonde, id) => {
                    if (content === undefined || content === "") {
                        return "";
                    }
                    const newNonce = (0, utls_1.nextNonce)();
                    switch ((0, utls_1.custom2Type)(customId)) {
                        case "customZoom":
                            const httpStatus = await this.MJApi.CustomZoomImagineApi({
                                msgId: id,
                                customId,
                                prompt: content,
                                nonce: newNonce,
                            });
                            if (httpStatus !== 204) {
                                throw new Error(`CustomZoomImagineApi failed with status ${httpStatus}`);
                            }
                            return newNonce;
                        case "variation":
                            if (this.config.Remix !== true) {
                                return "";
                            }
                            customId = (0, utls_1.toRemixCustom)(customId);
                            const remixHttpStatus = await this.MJApi.RemixApi({
                                msgId: id,
                                customId,
                                prompt: content,
                                nonce: newNonce,
                            });
                            if (remixHttpStatus !== 204) {
                                throw new Error(`RemixApi failed with status ${remixHttpStatus}`);
                            }
                            return newNonce;
                        default:
                            return "";
                            throw new Error(`unknown customId ${customId}`);
                    }
                },
            });
        }
        if (content === undefined || content === "") {
            throw new Error(`content is required`);
        }
        return await this.WaitMessage(content, loading);
    }
    async ZoomOut({ level, msgId, hash, content, flags, loading, }) {
        let customId;
        switch (level) {
            case "high":
                customId = `MJ::JOB::high_variation::1::${hash}::SOLO`;
                break;
            case "low":
                customId = `MJ::JOB::low_variation::1::${hash}::SOLO`;
                break;
            case "2x":
                customId = `MJ::Outpaint::50::1::${hash}::SOLO`;
                break;
            case "1.5x":
                customId = `MJ::Outpaint::75::1::${hash}::SOLO`;
                break;
        }
        return this.Custom({
            msgId,
            customId,
            content,
            flags,
            loading,
        });
    }
    async Reroll({ msgId, hash, content, flags, loading, }) {
        return await this.Custom({
            customId: `MJ::JOB::reroll::0::${hash}::SOLO`,
            msgId,
            content,
            flags,
            loading,
        });
    }
    Close() {
        if (this.wsClient) {
            this.wsClient.close();
            this.wsClient = undefined;
        }
    }
}
exports.Midjourney = Midjourney;
//# sourceMappingURL=midjourney.js.map