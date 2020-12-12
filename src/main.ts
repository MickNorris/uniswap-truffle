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


const utils = new Utils("mainnet");

let provider: ethers.providers.JsonRpcProvider | ethers.providers.InfuraProvider;
let alerts: Alerts;
let trades: Trades;
let discord: any;

function messageListener() {

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

                    // new alert [name] [token address] [target] 
                    
                    // exit on incorrect usage
                    if (commands.length !== 5) {
                        utils.log(usage());
                        return;
                    }

                    // get alert info
                    const name = commands[2];
                    const address = commands[3];
                    const target = commands[4].replace("$","");
                    // const direction = (commands[5] === "over" ? 0 : 1);


                    // get token data
                    const token = await utils.getToken(address);

                    // create new alert
                    alerts.newAlert(name, token, target, (price: number) => {
                        utils.log(`${name} @ \$${price}`, true);
                    });

                    utils.log(`new alert created for ${name} to go cross \$${target}`);

                } else if (commands[1] === "trade") {

                    // new trade [name] [token address] [entry] [target] [exit] [size]

                    // exit on incorrect usage
                    if (commands.length !== 8) {
                        utils.log(usage());
                        return;
                    }

                    // get token
                    const name = commands[2];
                    const token = await utils.getToken(commands[3]);
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

}


// login to discord and wait for initialization to complete
utils.initDiscord().then(async () => {

    // get provider reference
    provider = await utils.getProvider();

    // get wallet balance
    let balance = await utils.getWalletBalance();
    console.log(`\n${ethers.utils.formatEther(balance)} ${ethers.constants.EtherSymbol}\n`);

    // get discord reference
    discord = utils.getDiscord();

    // setup alerts
    alerts = new Alerts(provider, utils);

    // parse and handle messages and commands
    messageListener();

});