const Swap = artifacts.require("Swap");
const Leverage = artifacts.require("Leverage");
const Utils = import("../src/Utils");
// import { tokenToETH } from '../src/utils.ts';

// const utils = new Utils();

contract('Leverage', function(accounts){

  it("should take out a leveraged loan", () => {

    return Leverage.deployed().then((instance) => {
      return instance.double.call(num);
    }).then((balance) => {
      assert.equal(balance.valueOf(), num * 2, `Expected ${num * 2}; Received ${balance}`);
    })


  })

});

/*
contract('Swap', function(accounts){

  it("should double a number", () => {

    const num = 3;    
    return Swap.deployed()
    .then((instance) => {
      return instance.double.call(num);
    }).then((balance) => {
      assert.equal(balance.valueOf(), num * 2, `Expected ${num * 2}; Received ${balance}`);
    });

  });


  it("should show a token balance of 0", async () => {
      return await Swap.deployed()
      .then(async (instance) => {

        // get the token address
        const addr = instance.address;

        // setup provider
        const provider = ethers.getDefaultProvider(3, {
            infura: process.env.INFURA_ID
        });

        // setup account
        const signer = new ethers.Wallet(Buffer.from(process.env.DEPLOYMENT_ACCOUNT_KEY, "hex"));
        const account = signer.connect(provider);

        const tokenContract = new ethers.Contract(token.address, process.env.GENERIC_CONTRACT, account);

        await main.setup('ropsten', addr);

        // swap tokens to eth
        await main.tokenToEth(token);

        // get new balance
        const balance = await tokenContract.balanceOf(process.env.DEPLOYMENT_ACCOUNT_ADDRESS);

        assert.equal(balance.valueOf(), 0, `Expected balance to be 0. Balance is ${balance}`);

      });
  })

  /*
  it("should return the name Filip", function(){
    return HelloWorld.deployed().then(function(instance){
      return instance.getName.call();
    }).then(function(name){
      assert.equal(name, "Filip", "the name was not filip");
    });
  });

  it("should return the name Bob", function(){
    return HelloWorld.deployed().then(function(instance){
      return instance.setName('Bob').then(function(){
        return instance.getName.call();
      }).then(function(name){
        assert.equal(name, "Bob", "the name was not Bob");
      });
    });
  });

});

*/