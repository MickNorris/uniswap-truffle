require("dotenv").config()
// import { legos } from "@studydefi/money-legos";
import { ChainId, Fetcher, Token, Route, WETH, Trade, TokenAmount, TradeType, Percent, Pair, ETHER } from "@uniswap/sdk";
import { ethers, Contract } from "ethers";
import axios from "axios";
import Alerts from "./alerts";
import Trades from "./trades";
import  Utils from "./utils";
const Web3 = require('web3');


// returns commands usage
function usage() {
    return(
        "commands:\n" + 
        "new trade [name] [token address] [entry] [target] [exit]\n" + 
        "new alert [name] [token address] [target] ['over' or 'under']\n" + 
        "delete alert [name]"
    );
}


async function processTranscations() {

    // get web3
    const web3 = new Web3(process.env.INFURA_URL);

    var subscription = web3.eth.subscribe('pendingTransactions', function(error: any, result: any){
        if (!error)
            console.log(result);
    })
    .on("data", function(transaction: any){
        console.log(transaction);
    });
    


    return;

    web3.eth.subscribe('pendingTransactions', (err: any, res: any) => {
        if (err)
            console.log(err);
        else
            console.log(res);
    });

    // get transactions
    const pending = await web3.eth.getBlock("latest");

    // this should exist
    if (!pending.transactions)
        return;

    // iterate through transaction ids
    for (const id of pending.transactions)
        console.log(id);


}

const utils = new Utils("mainnet");

// login to discord and wait for initialization to complete
utils.initDiscord().then(async () => {

    // get provider reference
    const provider = await utils.getProvider();

    // web3.eth.getPendingTransactions().then(console.log);

    // get discord reference
    const discord:any = utils.getDiscord();

    // setup alerts
    const alerts = new Alerts(provider, utils);

    // setup trades 
    // const trades = await new Trades(provider, utils, alerts);

    // console.log(utils.environmentChecker());

    const uni = await Fetcher.fetchTokenData(ChainId.MAINNET, '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', provider);
    
    // utils.swapETH(uni, "0.0001");

    // trades.newSetup("axn", zora, 838, 1069, 743, 1.103);
    /*
    alerts.newAlert("uni", uni, 1000, 1, (price: number) => {
        console.log(price);
    });
    */


    // const mph = await Fetcher.fetchTokenData(ChainId.MAINNET, '0x8888801af4d980682e47f1a9036e589479e835c5', provider);


    let balance = await utils.getWalletBalance();
    console.log(`\n${ethers.utils.formatEther(balance)} ${ethers.constants.EtherSymbol}\n`);

    // utils.swapETH(uni, "0.05", "5");
    // let tokenBal = await utils.getTokenBalance(uni);
    // console.log(ethers.utils.formatEther(tokenBal) + " UNI");

    // get provider and setup alerts w/ it

    // listen for messages
    discord.on("message", async (message: any) => {

        // is this in the social channel?
        if (message.channel.id !== process.env.DISCORD_OUTPUT_ID)
            return;

        // my discord id
        const me = '282679916410175488';

        // exit if not me 
        if (message.author.id !== me)
            return;

        // get the message content
        const text = message.content;

        const commands = text.split(" ");

        // check for correct command format
        if (commands.indexOf("help") !== -1) {
            utils.log(usage());
            return;
        }

        switch (commands[0]) {

            case "new": 

                if (commands[1] === "alert") {

                    // new alert [name] [token address] [target] ['over' or 'under']
                    
                    // exit on incorrect usage
                    if (commands.length !== 6) {
                        utils.log(usage());
                        return;
                    }

                    // get alert info
                    const name = commands[2];
                    const address = commands[3];
                    const target = commands[4].replace("$","");
                    const direction = (commands[5] === "over" ? 0 : 1);


                    // get token data
                    const token = await Fetcher.fetchTokenData(ChainId.MAINNET, address, provider);

                    // create new alert
                    alerts.newAlert(name, token, target, direction, (price: number) => {
                        utils.log(`${name} @ \$${price}`, true);
                    });


                    // send confirmation
                    if (direction === 0)
                        utils.log(`new alert created for ${name} to go over \$${target}`);
                    else 
                        utils.log(`new alert created for ${name} to go under \$${target}`);


                } else if (commands[1] === "trade") {

                    // new trade [name] [token address] [entry] [target] [exit] [size]

                    // exit on incorrect usage
                    if (commands.length !== 8) {
                        utils.log(usage());
                        return;
                    }

                    // get token
                    const name = commands[2];
                    const token = await Fetcher.fetchTokenData(ChainId.MAINNET, commands[3], provider);
                    const entry = commands[4].replace("$","");
                    const target = commands[5].replace("$","");
                    const exit = commands[6].replace("$","");
                    const size = commands[7].replace("$","");

                    // trades.newTrade(name, token, entry, target, exit, size);
                }

                break;
                    
            case "delete": 

                if (commands.length !== 3) {
                    utils.log(usage());
                    return;
                }
                const name = commands[2];

                // delete alert
                let deleted = await alerts.deleteAlert(name);

                if (deleted) 
                    utils.log(`${name} deleted`);

                break;
        }
        
        
    })
});