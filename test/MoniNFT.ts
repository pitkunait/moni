import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MoniNFT", function () {

    async function deploy() {
        const [owner, otherAccount] = await ethers.getSigners();
        const MoniNFT = await ethers.getContractFactory("MoniNFT");
        const contract = await MoniNFT.deploy("MoniNFT", "MONI");
        const whitelistStart = await time.latest() + 60 * 60;
        const allowListStart = await time.latest() + 2 * 60 * 60;
        const publicStart = await time.latest() + 3 * 60 * 60;
        return {contract, owner, otherAccount, whitelistStart, allowListStart, publicStart};
    }

    describe("Contract tests", function () {
        it("Should revert if sale is not open", async function () {
            const {contract, owner} = await loadFixture(deploy);
            await expect(contract.mint(1)).to.be.revertedWith("Sale is closed");
        });

        it("Stage should be equal to 0", async function () {
            const {contract, owner} = await loadFixture(deploy);
            expect(await contract.stage()).to.be.equal(0);
        });

        it("Stage should be equal to 5", async function () {
            const {contract, owner} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            expect(await contract.stage()).to.be.equal(5);
        });

        it("Stage should be equal to 5", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.setSaleStart(whitelistStart, allowListStart, publicStart);
            expect(await contract.stage()).to.be.equal(5);
        });

        it("Stage should be equal to 2", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.setSaleStart(whitelistStart, allowListStart, publicStart);
            await time.increase(60 * 60);
            expect(await contract.stage()).to.be.equal(2);
        });

        it("Stage should be equal to 3", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.setSaleStart(whitelistStart, allowListStart, publicStart);
            await time.increase(2 * 60 * 60);
            expect(await contract.stage()).to.be.equal(3);
        });

        it("Stage should be equal to 4", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.setSaleStart(whitelistStart, allowListStart, publicStart);
            await time.increase(3 * 60 * 60);
            expect(await contract.stage()).to.be.equal(4);
        });

        it("Should be reverted because wallet is not in whitelist", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.setSaleStart(whitelistStart, allowListStart, publicStart);
            await time.increase( 60 * 60);
            const price = await contract.pricePerToken();
            await expect(contract.mint(1, {value: price})).to.be.revertedWith("Wallet is not in whitelist");
        });

        it("Should be able to mint in whitelist", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.setSaleStart(whitelistStart, allowListStart, publicStart);
            await time.increase( 60 * 60);
            await contract.setWhiteList([owner.address]);
            const price = await contract.pricePerToken();
            await contract.mint(1, {value: price});
            expect(await contract.ownerOf(1)).to.be.equal(owner.address);
        });

        it("Should be reverted because wallet is not in allowlist", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.setSaleStart(whitelistStart, allowListStart, publicStart);
            await time.increase( 2 * 60 * 60);
            await contract.setWhiteList([owner.address]);
            const price = await contract.pricePerToken();
            await expect(contract.mint(1, {value: price})).to.be.revertedWith("Wallet is not in allowlist");
        });

        it("Should be able to mint in allowlist", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.setSaleStart(whitelistStart, allowListStart, publicStart);
            await time.increase( 2 * 60 * 60);
            await contract.setWhiteList([owner.address]);
            await contract.setAllowList([owner.address]);
            const price = await contract.pricePerToken();
            await contract.mint(1, {value: price});
            expect(await contract.ownerOf(1)).to.be.equal(owner.address);
        });

        it("Should be able to mint in public mint", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.setSaleStart(whitelistStart, allowListStart, publicStart);
            await time.increase( 3 * 60 * 60);
            const price = await contract.pricePerToken();
            await contract.mint(1, {value: price});
            expect(await contract.ownerOf(1)).to.be.equal(owner.address);
        });

        it("Should revert because sent ether is incorrect", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.setSaleStart(whitelistStart, allowListStart, publicStart);
            await time.increase( 3 * 60 * 60);
            const price = await contract.pricePerToken();
            await expect(contract.mint(1, {value: price.div(2)})).to.be.revertedWith("Ether value sent is not correct")
        });


        it("Should return correct available to mint value", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.setSaleStart(whitelistStart, allowListStart, publicStart);
            await time.increase( 3 * 60 * 60);
            const price = await contract.pricePerToken();

            expect(await contract.availableToMint(owner.address)).to.equal(2);
            await contract.mint(1, {value: price});
            expect(await contract.availableToMint(owner.address)).to.equal(1);
            await contract.mint(1, {value: price});
            expect(await contract.availableToMint(owner.address)).to.equal(0);
        });

        it("Should revert because token limit exceeded", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.setSaleStart(whitelistStart, allowListStart, publicStart);
            await time.increase( 3 * 60 * 60);
            const price = await contract.pricePerToken();
            await contract.mint(2, {value: price.mul(2)});
            await expect(contract.mint(1, {value: price})).to.revertedWith("Token count exceeded")
        });

        it("Should not be in whitelist", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.setSaleStart(whitelistStart, allowListStart, publicStart);
            expect(await contract.isWalletWhitelisted(owner.address)).to.be.equal(false);
        });

        it("Should be in whitelist", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.setSaleStart(whitelistStart, allowListStart, publicStart);
            await contract.setWhiteList([owner.address]);
            expect(await contract.isWalletWhitelisted(owner.address)).to.be.equal(true);
        });

        it("Should not be in allowlist", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.setSaleStart(whitelistStart, allowListStart, publicStart);
            expect(await contract.isWalletAllowlisted(owner.address)).to.be.equal(false);
        });

        it("Should be in allowlist", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.setSaleStart(whitelistStart, allowListStart, publicStart);
            await contract.setAllowList([owner.address]);
            expect(await contract.isWalletAllowlisted(owner.address)).to.be.equal(true);
        });

        it("Should be able to add many wallets to wehitelist", async function () {
            const {contract, owner,otherAccount, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.setSaleStart(whitelistStart, allowListStart, publicStart);
            await contract.setWhiteList([...Array(600)].map(_ => owner.address));
            expect(await contract.isWalletWhitelisted(owner.address)).to.be.equal(true);
        });

    });
});
