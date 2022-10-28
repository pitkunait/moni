import { ethers, run } from "hardhat";

async function main() {
    await run("verify:verify", {
        address: "0xb35380e2415CC3898d9fc56e0887ea1d30fe8FD3",
        constructorArguments: [
            "Moni Wizards",
            "MWIZ",
            50,
            200,
            ethers.utils.parseEther("0.1"),
        ],
    });
    console.log("VERIFICATION COMPLETE");

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
