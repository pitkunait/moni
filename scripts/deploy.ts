import { ethers } from "hardhat";
import { readdirSync, readFileSync, writeFileSync } from "fs";

async function main() {
    const MoniNFT = await ethers.getContractFactory("MoniNFT");
    const moniNFT = await MoniNFT.deploy("MoniNFT", "MONI",50, 200, ethers.utils.parseEther("0.1"), 1);
    await moniNFT.deployed();

    const path = 'artifacts/build-info';
    const output = 'jsoninput/stdinput.json';
    const files = readdirSync(path);
    const rawdata = readFileSync(`${path}/${files[0]}`).toString();
    const stdinput = JSON.parse(rawdata)['input'];
    writeFileSync(output, JSON.stringify(stdinput));

    console.log(`Contract deployed to ${moniNFT.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
