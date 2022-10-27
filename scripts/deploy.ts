import { ethers, run } from "hardhat";
import { readdirSync, readFileSync, writeFileSync } from "fs";

async function main() {
    const MoniNFT = await ethers.getContractFactory("MoniWizards");
    const moniNFT = await MoniNFT.deploy("Moni Wizards", "MWIZ", 50, 200, ethers.utils.parseEther("0.1"), 1);
    await moniNFT.deployed();
    await moniNFT.deployTransaction.wait(5);

    await moniNFT.transferOwnership("0x28804F29068C130170DeFaCE2DD8401b6d317305");

    const path = 'artifacts/build-info';
    const output = 'jsoninput/stdinput.json';
    const files = readdirSync(path);
    const rawdata = readFileSync(`${path}/${files[0]}`).toString();
    const stdinput = JSON.parse(rawdata)['input'];
    writeFileSync(output, JSON.stringify(stdinput));

    console.log(`Contract deployed to ${moniNFT.address}`);

    await run("verify:verify", {
        address: moniNFT.address,
        constructorArguments: [
            "Moni Wizards",
            "MWIZ",
            50,
            200,
            ethers.utils.parseEther("0.1"),
            1
        ],
    });
    console.log("VERIFICATION COMPLETE");

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
