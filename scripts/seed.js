const hre = require("hardhat");
const config = require('../src/config.json');

const tokens = (n) => {
    return hre.ethers.utils.parseUnits(n.toString(), 'ether');
}

const ether = tokens;
const shares = tokens;

async function main() {
    // fetch accounts
    console.log(`Fetching accounts & network \n`);
    const accounts = await hre.ethers.getSigners();
    const deployer = accounts[0];
    const investor1 = accounts[1];
    const investor2 = accounts[2];
    const investor3 = accounts[3];
    const investor4 = accounts[4];

    // fetch network
    const { chainId } = await hre.ethers.provider.getNetwork();

    console.log(`Fetching token and transferring to accounts \n`);

    // fetch Dapp token
    const dapp = await hre.ethers.getContractAt('Token', config[chainId].dapp.address);
    console.log(`Dapp token fetched to: ${dapp.address}\n`);

    // fetch USD token
    const usd = await hre.ethers.getContractAt('Token', config[chainId].usd.address);
    console.log(`Dapp token fetched to: ${usd.address}\n`);

    ////////////////////////////////////////////////////////////////////////////////
    // Distribute tokens to investors
    //

    let transaction;

    // send Dapp to investor1
    transaction = await dapp.connect(deployer).transfer(investor1.address, tokens(10));
    await transaction.wait();

    // send USD to investor2
    transaction = await usd.connect(deployer).transfer(investor2.address, tokens(10));
    await transaction.wait();

    // send Dapp to investor3
    transaction = await dapp.connect(deployer).transfer(investor3.address, tokens(10));
    await transaction.wait();

    // send USD to investor4
    transaction = await usd.connect(deployer).transfer(investor4.address, tokens(10));
    await transaction.wait();

    ////////////////////////////////////////////////////////////////////////////////
    // Adding liquidity
    //

    let amount = tokens(100);

    console.log(`Fetching AMM \n`);

    // fetch AMM
    const amm = await hre.ethers.getContractAt('AMM', config[chainId].amm.address);
    console.log(`AMM fetched to: ${amm.address}\n`);

    transaction = await dapp.connect(deployer).approve(amm.address, amount);
    await transaction.wait();

    transaction = await usd.connect(deployer).approve(amm.address, amount);
    await transaction.wait();

    // deployer adds liquidity
    console.log(`Adding liquidity \n`);
    transaction = await amm.connect(deployer).addLiquidity(amount, amount);
    await transaction.wait();

    ////////////////////////////////////////////////////////////////////////////////
    // Investor 1 swaps: Dapp -> USD
    //

    console.log(`Investor 1 swapping Dapp -> USD \n`);
    // investor1 approves all tokens to AMM
    transaction = await dapp.connect(investor1).approve(amm.address, tokens(10));
    await transaction.wait();

    // investor1 swaps 1 token
    transaction = await amm.connect(investor1).swapToken1(tokens(1));
    await transaction.wait();

    ////////////////////////////////////////////////////////////////////////////////
    // Investor 2 swaps: USD -> Dapp
    //

    console.log(`Investor 2 swapping USD -> Dapp \n`);
    // investor1 approves all tokens to AMM
    transaction = await usd.connect(investor2).approve(amm.address, tokens(10));
    await transaction.wait();

    // investor1 swaps 1 token
    transaction = await amm.connect(investor2).swapToken2(tokens(1));
    await transaction.wait();

    ////////////////////////////////////////////////////////////////////////////////
    // Investor 3 swaps: Dapp -> USD
    //

    console.log(`Investor 3 swapping Dapp -> USD \n`);
    // investor1 approves all tokens to AMM
    transaction = await dapp.connect(investor3).approve(amm.address, tokens(10));
    await transaction.wait();

    // investor1 swaps all 10 tokens
    transaction = await amm.connect(investor3).swapToken1(tokens(10));
    await transaction.wait();

    ////////////////////////////////////////////////////////////////////////////////
    // Investor 4 swaps: USD -> Dapp
    //

    console.log(`Investor 4 swapping USD -> Dapp \n`);
    // investor1 approves all tokens to AMM
    transaction = await usd.connect(investor4).approve(amm.address, tokens(10));
    await transaction.wait();

    // investor1 swaps 5 tokens
    transaction = await amm.connect(investor4).swapToken2(tokens(5));
    await transaction.wait();

    console.log(`finished \n`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
