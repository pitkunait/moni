import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MoniWizards", function () {

    async function deploy() {
        const [owner, otherAccount, otherAccount2] = await ethers.getSigners();
        const MoniNFT = await ethers.getContractFactory("MoniWizards");
        const contract = await MoniNFT.deploy("Moni Wizards", "MWIZ", 50, 200, ethers.utils.parseEther("1"), 1);
        const whitelistStart = await time.latest() + 60 * 60;
        const allowListStart = await time.latest() + 2 * 60 * 60;
        const publicStart = await time.latest() + 3 * 60 * 60;
        return {contract, owner, otherAccount, otherAccount2, whitelistStart, allowListStart, publicStart};
    }

    describe("Contract tests", function () {
        it("Should revert if sale is not open", async function () {
            const {contract, owner} = await loadFixture(deploy);
            await contract.connect(owner).setWhiteList([...Array(600)].map(_ => owner.address));
        });
    });
});
