"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyHuman = void 0;
const inference_1 = require("@huggingface/inference");
class VerifyHuman {
    config;
    inference;
    constructor(config) {
        this.config = config;
        const { HuggingFaceToken } = config;
        if (HuggingFaceToken === "" || HuggingFaceToken) {
            throw new Error("HuggingFaceToken is required");
        }
        this.inference = new inference_1.HfInference(HuggingFaceToken);
    }
    async verify(imageUri, categories) {
        console.log("verify----start", imageUri, categories);
        const imageCates = await this.inference.imageClassification({
            data: await (await this.config.fetch(imageUri)).blob(),
            model: "google/vit-base-patch16-224",
        });
        console.log("verify----response", { imageCates });
        for (const imageCate of imageCates) {
            const { label } = imageCate;
            for (const category of categories) {
                if (label.includes(category)) {
                    return category;
                }
            }
        }
    }
}
exports.VerifyHuman = VerifyHuman;
//# sourceMappingURL=verify.human.js.map