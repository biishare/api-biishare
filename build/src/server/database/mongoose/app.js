"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const dbUser = process.env.DB_USER;
const dbPassWord = process.env.DB_PASS;
if (!dbUser || !dbPassWord) {
    console.error("As variáveis de ambiente DB_USER e DB_PASS não estão definidas.");
    process.exit(1);
}
const connectDB = async () => {
    try {
        const mongoURI = `mongodb://${dbUser}:${dbPassWord}@cluster0-shard-00-00.l0jjc.mongodb.net:27017,cluster0-shard-00-01.l0jjc.mongodb.net:27017,cluster0-shard-00-02.l0jjc.mongodb.net:27017/billearn?ssl=true&replicaSet=atlas-1g0ku3-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0`;
        await mongoose_1.default.connect(mongoURI);
        console.log("MongoDB conectado com sucesso!");
    }
    catch (error) {
        console.error("Erro ao conectar ao MongoDB:", error);
        process.exit(1);
    }
};
exports.default = connectDB;
