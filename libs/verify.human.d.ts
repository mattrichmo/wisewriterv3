import { MJConfig } from "./interfaces";
export declare class VerifyHuman {
    config: MJConfig;
    private inference;
    constructor(config: MJConfig);
    verify(imageUri: string, categories: string[]): Promise<string | undefined>;
}
