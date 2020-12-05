"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
// import { legos } from "@studydefi/money-legos";
var sdk_1 = require("@uniswap/sdk");
var ethers_1 = require("ethers");
var axios_1 = require("axios");
var BN = require('bn.js');
require("dotenv").config();
var MyContract;
var wallet;
var swap;
var chain;
var provider;
var chainId;
var weth;
var signer;
var account;
function setup(chainName) {
    return __awaiter(this, void 0, void 0, function () {
        var walletPK, deployedNetwork;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // set chain name
                    chain = chainName;
                    // setup provider
                    /*
                    provider = ethers.getDefaultProvider(chain, {
                        infura: process.env.INFURA_ID
                    })
                    */
                    // match chain with ChainId Enum
                    if (chain === "mainnet") {
                        chainId = sdk_1.ChainId.MAINNET;
                    }
                    else if (chain === "ropsten") {
                        chainId = sdk_1.ChainId.ROPSTEN;
                    }
                    else if (chain === "dev") {
                        chainId = 5777;
                        // override provider
                        provider = new ethers_1.ethers.providers.JsonRpcProvider('http://127.0.0.1:9545');
                    }
                    // get chain WETH
                    weth = sdk_1.WETH[sdk_1.ChainId.MAINNET];
                    // get contract
                    MyContract = require("./../build/contracts/Swap.json");
                    // const contractFlashloanMoneyLegoAddress = FlashloanMoneyLego.networks[kovan.networkID].address;
                    // setup account
                    signer = new ethers_1.ethers.Wallet(Buffer.from(process.env.DEV_ACCOUNT_KEY, "hex"));
                    account = signer.connect(provider);
                    walletPK = "0x" + process.env.DEV_ACCOUNT_KEY;
                    wallet = new ethers_1.Wallet(walletPK, provider);
                    deployedNetwork = MyContract.networks[chainId];
                    // construct contract
                    swap = new ethers_1.Contract(deployedNetwork.address, MyContract.abi, account);
                    return [4 /*yield*/, wallet.getBalance().then(function (res) {
                            console.log("\nWallet balance: " + ethers_1.ethers.utils.formatEther(res.toString()) + " ETH");
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.setup = setup;
// get the best gas price from eth gas
function getGasPrice(speed) {
    return __awaiter(this, void 0, void 0, function () {
        var price;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios_1["default"].get('https://ethgasstation.info/api/ethgasAPI.json?api-key=' + process.env.DEFI_PULSE_KEY)];
                case 1:
                    price = _a.sent();
                    if (speed === "fastest")
                        return [2 /*return*/, (parseInt(price.data.fastest) / 10)];
                    else if (speed === "fast")
                        return [2 /*return*/, (parseInt(price.data.fast) / 10)];
                    else
                        return [2 /*return*/, (parseInt(price.data.average) / 10)];
                    return [2 /*return*/];
            }
        });
    });
}
function approveContract(address) {
    return __awaiter(this, void 0, void 0, function () {
        var balance;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, swap.balanceOf(process.env.DEPLOYMENT_ACCOUNT_ADDRESS)];
                case 1:
                    balance = _a.sent();
                    console.log("Token Balance: " + ethers_1.ethers.utils.formatEther(balance.toString()));
                    return [2 /*return*/];
            }
        });
    });
}
exports.approveContract = approveContract;
function approveTokens(inputToken) {
    return __awaiter(this, void 0, void 0, function () {
        var token, pair, tokenContract, balance, gasPrice, gas, tx, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(typeof inputToken === "string")) return [3 /*break*/, 2];
                    return [4 /*yield*/, sdk_1.Fetcher.fetchTokenData(sdk_1.ChainId.MAINNET, inputToken)];
                case 1:
                    token = _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    token = token = inputToken;
                    _a.label = 3;
                case 3: return [4 /*yield*/, sdk_1.Fetcher.fetchPairData(weth, token)];
                case 4:
                    pair = _a.sent();
                    tokenContract = new ethers_1.ethers.Contract(token.address, process.env.GENERIC_CONTRACT, account);
                    return [4 /*yield*/, tokenContract.functions.balanceOf(process.env.DEV_ACCOUNT_ADDRESS)];
                case 5:
                    balance = _a.sent();
                    console.log("Token Balance: " + ethers_1.ethers.utils.formatEther(balance.toString()));
                    return [2 /*return*/];
                case 6:
                    gasPrice = _a.sent();
                    gas = ethers_1.ethers.utils.parseUnits(gasPrice.toString(), "gwei");
                    console.log("Current Gas Price: " + gasPrice + " \n");
                    return [4 /*yield*/, tokenContract.approve('0x7a250d5630b4cf539739df2c5dacb4c659f2488d', balance, {
                            gasPrice: gasPrice * 1e9,
                            gasLimit: '4000000'
                        })];
                case 7:
                    tx = _a.sent();
                    console.log("Transaction Hash https://" + chain + ".etherscan.io/tx/" + tx.hash);
                    _a.label = 8;
                case 8:
                    _a.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, tx.wait()];
                case 9:
                    _a.sent();
                    return [3 /*break*/, 11];
                case 10:
                    e_1 = _a.sent();
                    console.log("Transaction Failed: https://" + chain + ".etherscan.io/tx/" + tx.hash);
                    return [2 /*return*/];
                case 11:
                    console.log("Transaction Success: https://" + chain + ".etherscan.io/tx/" + tx.hash);
                    return [2 /*return*/];
            }
        });
    });
}
exports.approveTokens = approveTokens;
function swapETH(inputToken, amountETH) {
    return __awaiter(this, void 0, void 0, function () {
        var token, pair, route, trade, slippageTolerance, amountOutMin, deadline, value, tokenContract, approve, gasPrice, tx, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(typeof inputToken === "string")) return [3 /*break*/, 2];
                    return [4 /*yield*/, sdk_1.Fetcher.fetchTokenData(sdk_1.ChainId.MAINNET, inputToken)];
                case 1:
                    token = _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    token = inputToken;
                    _a.label = 3;
                case 3: return [4 /*yield*/, sdk_1.Fetcher.fetchPairData(token, weth)];
                case 4:
                    pair = _a.sent();
                    route = new sdk_1.Route([pair], weth);
                    trade = new sdk_1.Trade(route, new sdk_1.TokenAmount(weth, ethers_1.ethers.utils.parseEther(amountETH).toString()), sdk_1.TradeType.EXACT_INPUT);
                    slippageTolerance = new sdk_1.Percent('2', '100');
                    amountOutMin = trade.minimumAmountOut(slippageTolerance).raw.toString();
                    deadline = Math.floor(Date.now() / 1000) + 60 * 10;
                    value = trade.inputAmount.raw.toString();
                    tokenContract = new ethers_1.ethers.Contract(token.address, process.env.GENERIC_CONTRACT, account);
                    return [4 /*yield*/, tokenContract.approve(swap.address, value)];
                case 5:
                    approve = _a.sent();
                    // wait for contract approval
                    return [4 /*yield*/, approve.wait()];
                case 6:
                    // wait for contract approval
                    _a.sent();
                    return [4 /*yield*/, getGasPrice("fastest")];
                case 7:
                    gasPrice = _a.sent();
                    // const gas = ethers.utils.parseUnits(gasPrice.toString(), "gwei");
                    console.log("Current Gas Price: " + gasPrice + " \n");
                    return [4 /*yield*/, swap.swapExactETHForTokens(token.address, amountOutMin, deadline, {
                            value: value,
                            gasPrice: gasPrice * 1e9,
                            gasLimit: '4000000'
                        })];
                case 8:
                    tx = _a.sent();
                    console.log("Transaction Hash https://" + chain + ".etherscan.io/tx/" + tx.hash);
                    _a.label = 9;
                case 9:
                    _a.trys.push([9, 11, , 12]);
                    return [4 /*yield*/, tx.wait()];
                case 10:
                    _a.sent();
                    return [3 /*break*/, 12];
                case 11:
                    e_2 = _a.sent();
                    console.log("Transaction Failed: https://" + chain + ".etherscan.io/tx/" + tx.hash);
                    return [2 /*return*/];
                case 12:
                    console.log("Transaction Success: https://" + chain + ".etherscan.io/tx/" + tx.hash);
                    return [2 /*return*/];
            }
        });
    });
}
exports.swapETH = swapETH;
// swap token for eth 
function swapToken(inputToken) {
    return __awaiter(this, void 0, void 0, function () {
        var token, contract, pair, balance, route, trade, gasPrice, slippageTolerance, amountIn, amountOutMin, deadline, tx, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(typeof inputToken === "string")) return [3 /*break*/, 2];
                    return [4 /*yield*/, sdk_1.Fetcher.fetchTokenData(sdk_1.ChainId.ROPSTEN, inputToken)];
                case 1:
                    token = _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    token = inputToken;
                    _a.label = 3;
                case 3:
                    contract = new ethers_1.ethers.Contract(token.address, process.env.GENERIC_CONTRACT, provider);
                    return [4 /*yield*/, sdk_1.Fetcher.fetchPairData(token, weth)];
                case 4:
                    pair = _a.sent();
                    return [4 /*yield*/, contract.balanceOf(process.env.DEPLOYMENT_ACCOUNT_ADDRESS)];
                case 5:
                    balance = _a.sent();
                    console.log("Token Balance: " + ethers_1.ethers.utils.formatEther(balance.toString()));
                    route = new sdk_1.Route([pair], token);
                    trade = new sdk_1.Trade(route, new sdk_1.TokenAmount(token, balance.toString()), sdk_1.TradeType.EXACT_INPUT);
                    return [4 /*yield*/, getGasPrice("fastest")];
                case 6:
                    gasPrice = _a.sent();
                    // const gas = ethers.utils.parseUnits(gasPrice.toString(), "gwei");
                    console.log("Current Gas Price: " + gasPrice + " \n");
                    slippageTolerance = new sdk_1.Percent('5', '100');
                    amountIn = trade.inputAmount.raw.toString();
                    amountOutMin = trade.minimumAmountOut(slippageTolerance).raw.toString();
                    deadline = Math.floor(Date.now() / 1000) + 60 * 10;
                    // amountIn = ethers.utils.parseUnits(amountIn).toString();
                    // amountOutMin = ethers.utils.parseUnits(amountOutMin).toString();
                    console.log(amountIn + " / " + amountOutMin);
                    return [4 /*yield*/, swap.swapExactTokensForETH(token.address, amountIn, amountOutMin, deadline, {
                            gasPrice: gasPrice * 1e9,
                            gasLimit: '4000000'
                        })];
                case 7:
                    tx = _a.sent();
                    console.log("Transaction Hash https://" + chain + ".etherscan.io/tx/" + tx.hash);
                    _a.label = 8;
                case 8:
                    _a.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, tx.wait()];
                case 9:
                    _a.sent();
                    return [3 /*break*/, 11];
                case 10:
                    e_3 = _a.sent();
                    console.log(e_3);
                    console.log("Transaction Failed: https://" + chain + ".etherscan.io/tx/" + tx.hash);
                    return [2 /*return*/];
                case 11:
                    console.log("Transaction Success: https://" + chain + ".etherscan.io/tx/" + tx.hash);
                    return [2 /*return*/, tx];
            }
        });
    });
}
exports.swapToken = swapToken;
var start = function () { return __awaiter(void 0, void 0, void 0, function () {
    var token, e_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, sdk_1.Fetcher.fetchTokenData(sdk_1.ChainId.MAINNET, '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984')];
            case 1:
                token = _a.sent();
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, swapETH(token, "0.5")];
            case 3:
                _a.sent();
                return [3 /*break*/, 5];
            case 4:
                e_4 = _a.sent();
                console.log(e_4);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
setup("dev").then(function () { return start(); });
