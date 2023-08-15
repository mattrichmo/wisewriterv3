import WebSocket from "isomorphic-ws";
export type FetchFn = typeof fetch;
export type WebSocketCl = typeof WebSocket;
export declare const MJBot = "936929561302675456";
export declare const NijiBot = "1022952195194359889";
export interface MJConfig {
    ChannelId: string;
    SalaiToken: string;
    BotId: typeof MJBot | typeof NijiBot;
    Debug: boolean;
    Limit: number;
    MaxWait: number;
    SessionId: string;
    ServerId?: string;
    Ws?: boolean;
    Remix?: boolean;
    HuggingFaceToken?: string;
    DiscordBaseUrl: string;
    WsBaseUrl: string;
    fetch: FetchFn;
    ApiInterval: number;
    WebSocket: WebSocketCl;
}
export interface MJConfigParam {
    SalaiToken: string;
    ChannelId?: string;
    ServerId?: string;
    BotId?: typeof MJBot | typeof NijiBot;
    Debug?: boolean;
    ApiInterval?: number;
    Limit?: number;
    MaxWait?: number;
    Ws?: boolean;
    HuggingFaceToken?: string;
    SessionId?: string;
    DiscordBaseUrl?: string;
    WsBaseUrl?: string;
    fetch?: FetchFn;
    WebSocket?: WebSocketCl;
}
export declare const DefaultMJConfig: MJConfig;
