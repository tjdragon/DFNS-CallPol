"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = exports.POLICY_USER_ID = exports.SENDER_WALLET_ID = exports.dfnsApi = void 0;
var sdk_1 = require("@dfns/sdk");
var sdk_keysigner_1 = require("@dfns/sdk-keysigner");
var dotenv_1 = require("dotenv");
var path_1 = require("path");
var url_1 = require("url");
var viem_1 = require("viem");
var chains_1 = require("viem/chains");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
// Load .env from scripts directory
dotenv_1.default.config({ path: path_1.default.join(__dirname, '.env') });
if (!process.env.DFNS_CRED_ID) {
    throw new Error("DFNS_CRED_ID not found in .env");
}
var signer = new sdk_keysigner_1.AsymmetricKeySigner({
    credId: process.env.DFNS_CRED_ID,
    privateKey: process.env.DFNS_PRIVATE_KEY,
});
exports.dfnsApi = new sdk_1.DfnsApiClient({
    orgId: process.env.DFNS_ORG_ID,
    authToken: process.env.DFNS_AUTH_TOKEN,
    baseUrl: process.env.DFNS_API_URL,
    signer: signer,
});
// Wallet ID to use for deployment
exports.SENDER_WALLET_ID = process.env.SENDER_WALLET_ID;
// User ID for policy
exports.POLICY_USER_ID = process.env.POLICY_USER_ID;
// Public Client for reading from chain
exports.client = (0, viem_1.createPublicClient)({
    chain: chains_1.sepolia,
    transport: (0, viem_1.http)(),
});
