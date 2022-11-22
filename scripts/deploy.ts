import { ethers, run } from "hardhat";

async function main() {

    const contractName = "Moni Wizards"; // "tt";
    const contractSymbol = "MWIZ"; // "ttt";

    const MoniNFT = await ethers.getContractFactory("MoniWizards");
    const moniNFT = await MoniNFT.deploy(
        contractName,
        contractSymbol,
        50,
        200,
        ethers.utils.parseEther("1")
    );
    await moniNFT.deployed();
    await moniNFT.deployTransaction.wait(5);

    await moniNFT.setSaleOpen();
    await moniNFT.setBaseURI("ipfs://bafybeihdj4s3vosgcnvgmooihg3fxckvaowt7twf6ptnisq7mvvjdpcdfy/");
    await moniNFT.transferOwnership("0x1204c2eAa7864691510D27218Ec974cC7d31929B");
    console.log(`Contract deployed to ${moniNFT.address}`);

    await run("verify:verify", {
        address: moniNFT.address,
        constructorArguments: [
            contractName,
            contractSymbol,
            50,
            200,
            ethers.utils.parseEther("1"),
        ],
    });
    console.log("VERIFICATION COMPLETE");

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
