import { ethers } from "hardhat";

async function main() {
  const MoniNFT = await ethers.getContractFactory("MoniNFT");
  const moniNFT = await MoniNFT.deploy("MoniNFT", "MONI");
  await moniNFT.deployed();
  console.log(`Contract deployed to ${moniNFT.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
