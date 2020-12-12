const HDWalletProvider = require("@truffle/hdwallet-provider")
const ethers = require("ethers");
require("dotenv").config();



// setup account
module.exports = {
  // Uncommenting the defaults below 
  // provides for an easier quick-start with Ganache.
  // You can also follow this format for other networks;
  // see <http://truffleframework.com/docs/advanced/configuration>
  // for more details on how to specify configuration options!
  networks: {

    ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },

    mainnet: {
      networkCheckTimeout: 1e9,
      provider: function() {

        return new HDWalletProvider(process.env.DEPLOYMENT_ACCOUNT_KEY, "wss://mainnet.infura.io/ws/v3/" + process.env.INFURA_API_KEY)

      },
      network_id: 1 
    },

  },

  mocha: {
    enableTimeouts: false,
    before_timeout: 120000 // Here is 2min but can be whatever timeout is suitable for you.
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.6.0",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      optimizer: {
          enabled: true,
          runs: 200
      },
      //  evmVersion: "byzantium"
      // }
    }
  }
};
