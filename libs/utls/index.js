"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toRemixCustom = exports.custom2Type = exports.content2prompt = exports.content2progress = exports.uriToHash = exports.formatInfo = exports.formatOptions = exports.formatPrompts = exports.nextNonce = exports.random = exports.sleep = void 0;
const snowyflake_1 = require("snowyflake");
const sleep = async (ms) => await new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
const random = (min, max) => Math.floor(Math.random() * (max - min) + min);
exports.random = random;
const snowflake = new snowyflake_1.Snowyflake({
    workerId: 0n,
    processId: 0n,
    epoch: snowyflake_1.Epoch.Discord, // BigInt timestamp
});
const nextNonce = () => snowflake.nextId().toString();
exports.nextNonce = nextNonce;
const formatPrompts = (prompts) => {
    const regex = /(\d️⃣ .+)/g;
    const matches = prompts.match(regex);
    if (matches) {
        const shortenedPrompts = matches.map((match) => match.trim());
        return shortenedPrompts;
    }
    else {
        return [];
    }
};
exports.formatPrompts = formatPrompts;
const formatOptions = (components) => {
    var data = [];
    for (var i = 0; i < components.length; i++) {
        const component = components[i];
        if (component.components && component.components.length > 0) {
            const item = (0, exports.formatOptions)(component.components);
            data = data.concat(item);
        }
        if (!component.custom_id)
            continue;
        data.push({
            type: component.type,
            style: component.style,
            label: component.label || component.emoji?.name,
            custom: component.custom_id,
        });
    }
    return data;
};
exports.formatOptions = formatOptions;
const formatInfo = (msg) => {
    let jsonResult = {
        subscription: "",
        jobMode: "",
        visibilityMode: "",
        fastTimeRemaining: "",
        lifetimeUsage: "",
        relaxedUsage: "",
        queuedJobsFast: "",
        queuedJobsRelax: "",
        runningJobs: "",
    }; // Initialize jsonResult with empty object
    msg.split("\n").forEach(function (line) {
        const colonIndex = line.indexOf(":");
        if (colonIndex > -1) {
            const key = line.substring(0, colonIndex).trim().replaceAll("**", "");
            const value = line.substring(colonIndex + 1).trim();
            switch (key) {
                case "Subscription":
                    jsonResult.subscription = value;
                    break;
                case "Job Mode":
                    jsonResult.jobMode = value;
                    break;
                case "Visibility Mode":
                    jsonResult.visibilityMode = value;
                    break;
                case "Fast Time Remaining":
                    jsonResult.fastTimeRemaining = value;
                    break;
                case "Lifetime Usage":
                    jsonResult.lifetimeUsage = value;
                    break;
                case "Relaxed Usage":
                    jsonResult.relaxedUsage = value;
                    break;
                case "Queued Jobs (fast)":
                    jsonResult.queuedJobsFast = value;
                    break;
                case "Queued Jobs (relax)":
                    jsonResult.queuedJobsRelax = value;
                    break;
                case "Running Jobs":
                    jsonResult.runningJobs = value;
                    break;
                default:
                // Do nothing
            }
        }
    });
    return jsonResult;
};
exports.formatInfo = formatInfo;
const uriToHash = (uri) => {
    return uri.split("_").pop()?.split(".")[0] ?? "";
};
exports.uriToHash = uriToHash;
const content2progress = (content) => {
    if (!content)
        return "";
    const spcon = content.split("<@");
    if (spcon.length < 2) {
        return "";
    }
    content = spcon[1];
    const regex = /\(([^)]+)\)/; // matches the value inside the first parenthesis
    const match = content.match(regex);
    let progress = "";
    if (match) {
        progress = match[1];
    }
    return progress;
};
exports.content2progress = content2progress;
const content2prompt = (content) => {
    if (!content)
        return "";
    const pattern = /\*\*(.*?)\*\*/; // Match **middle content
    const matches = content.match(pattern);
    if (matches && matches.length > 1) {
        return matches[1]; // Get the matched content
    }
    else {
        console.log("No match found.", content);
        return content;
    }
};
exports.content2prompt = content2prompt;
function custom2Type(custom) {
    if (custom.includes("upsample")) {
        return "upscale";
    }
    else if (custom.includes("variation")) {
        return "variation";
    }
    else if (custom.includes("reroll")) {
        return "reroll";
    }
    else if (custom.includes("CustomZoom")) {
        return "customZoom";
    }
    else if (custom.includes("Outpaint")) {
        return "variation";
    }
    else if (custom.includes("remaster")) {
        return "reroll";
    }
    return null;
}
exports.custom2Type = custom2Type;
const toRemixCustom = (customID) => {
    const parts = customID.split("::");
    const convertedString = `MJ::RemixModal::${parts[4]}::${parts[3]}::1`;
    return convertedString;
};
exports.toRemixCustom = toRemixCustom;
//# sourceMappingURL=index.js.map