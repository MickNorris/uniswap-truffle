const Swap = artifacts.require('Swap.sol');
// import { ethers } from "ethers";
Swap.synchronization_timeout = 60 * 5;


module.exports = async function(deployer, _, accounts) {
    await deployer.deploy(Swap,"0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
}