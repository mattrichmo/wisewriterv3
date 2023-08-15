import { DiscordImage, MJConfig } from "./interfaces";
export declare const Commands: readonly ["ask", "blend", "describe", "fast", "help", "imagine", "info", "prefer", "private", "public", "relax", "settings", "show", "stealth", "shorten", "subscribe"];
export type CommandName = typeof Commands[number];
export declare class Command {
    config: MJConfig;
    constructor(config: MJConfig);
    cache: Partial<Record<CommandName, Command>>;
    cacheCommand(name: CommandName): Promise<any>;
    allCommand(): Promise<void>;
    getCommand(name: CommandName): Promise<any>;
    imaginePayload(prompt: string, nonce?: string): Promise<{
        type: number;
        application_id: any;
        guild_id: string | undefined;
        channel_id: string;
        session_id: string;
        nonce: string | undefined;
        data: any;
    }>;
    PreferPayload(nonce?: string): Promise<{
        type: number;
        application_id: any;
        guild_id: string | undefined;
        channel_id: string;
        session_id: string;
        nonce: string | undefined;
        data: any;
    }>;
    shortenPayload(prompt: string, nonce?: string): Promise<{
        type: number;
        application_id: any;
        guild_id: string | undefined;
        channel_id: string;
        session_id: string;
        nonce: string | undefined;
        data: any;
    }>;
    infoPayload(nonce?: string): Promise<{
        type: number;
        application_id: any;
        guild_id: string | undefined;
        channel_id: string;
        session_id: string;
        nonce: string | undefined;
        data: any;
    }>;
    fastPayload(nonce?: string): Promise<{
        type: number;
        application_id: any;
        guild_id: string | undefined;
        channel_id: string;
        session_id: string;
        nonce: string | undefined;
        data: any;
    }>;
    relaxPayload(nonce?: string): Promise<{
        type: number;
        application_id: any;
        guild_id: string | undefined;
        channel_id: string;
        session_id: string;
        nonce: string | undefined;
        data: any;
    }>;
    settingsPayload(nonce?: string): Promise<{
        type: number;
        application_id: any;
        guild_id: string | undefined;
        channel_id: string;
        session_id: string;
        nonce: string | undefined;
        data: any;
    }>;
    describePayload(image: DiscordImage, nonce?: string): Promise<{
        type: number;
        application_id: any;
        guild_id: string | undefined;
        channel_id: string;
        session_id: string;
        nonce: string | undefined;
        data: any;
    }>;
    protected commandData(name: CommandName, options?: any[], attachments?: any[]): Promise<{
        version: any;
        id: any;
        name: any;
        type: any;
        options: any[];
        application_command: any;
        attachments: any[];
    }>;
    protected data2Paylod(data: any, nonce?: string): {
        type: number;
        application_id: any;
        guild_id: string | undefined;
        channel_id: string;
        session_id: string;
        nonce: string | undefined;
        data: any;
    };
}
