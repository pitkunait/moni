import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MoniNFT", function () {

    async function deploy() {
        const [owner, otherAccount, otherAccount2] = await ethers.getSigners();
        const MoniNFT = await ethers.getContractFactory("MoniNFT");
        const contract = await MoniNFT.deploy("MoniNFT", "MONI", 50, 200, ethers.utils.parseEther("1"), 1);
        const whitelistStart = await time.latest() + 60 * 60;
        const allowListStart = await time.latest() + 2 * 60 * 60;
        const publicStart = await time.latest() + 3 * 60 * 60;
        return {contract, owner, otherAccount, otherAccount2, whitelistStart, allowListStart, publicStart};
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
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            expect(await contract.stage()).to.be.equal(5);
        });

        it("Stage should be equal to 2", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await time.increase(60 * 60);
            expect(await contract.stage()).to.be.equal(2);
        });

        it("Stage should be equal to 3", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await time.increase(2 * 60 * 60);
            expect(await contract.stage()).to.be.equal(3);
        });

        it("Stage should be equal to 4", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await time.increase(3 * 60 * 60);
            expect(await contract.stage()).to.be.equal(4);
        });

        it("Stage should be equal to 6", async function () {
            const {
                contract,
                owner,
                otherAccount,
                otherAccount2,
                allowListStart,
                whitelistStart,
                publicStart
            } = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 2);
            await time.increase(3 * 60 * 60);
            const price = await contract.pricePerToken();
            expect(await contract.stage()).to.be.equal(4);
            await contract.mint(1, {value: price});
            let info = await contract.info();
            expect(info.waveSupply).to.be.equal(2);
            expect(info.waveMinted).to.be.equal(1);

            expect(await contract.connect(otherAccount).mint(1, {value: price}));
            info = await contract.info();
            expect(info.waveSupply).to.be.equal(2);
            expect(info.waveMinted).to.be.equal(2);

            await expect(contract.mint(1, {value: price})).to.be.revertedWith("Purchase would exceed wave max tokens");
            info = await contract.info();
            expect(info.waveSupply).to.be.equal(2);
            expect(info.waveMinted).to.be.equal(2);
            expect(await contract.stage()).to.be.equal(6);

            await contract.connect(owner).startWave(whitelistStart + 4 * 60 * 60, allowListStart + 5 * 60 * 60, publicStart + 6 * 60 * 60, 2);
            await time.increase(7 * 60 * 60);
            expect(await contract.stage()).to.be.equal(4);

            await contract.connect(otherAccount2).mint(1, {value: price});
            await expect(contract.connect(otherAccount).mint(1, {value: price})).to.be.revertedWith("Available token mint count exceeded");
            await contract.connect(owner).clearMinters();
            expect(await contract.connect(otherAccount).mint(1, {value: price}));

            info = await contract.info();
            expect(info.waveSupply).to.be.equal(2);
            expect(info.waveMinted).to.be.equal(2);
            expect(await contract.stage()).to.be.equal(6);

        });

        it("Should be reverted because wallet is not in whitelist", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await time.increase(60 * 60);
            const price = await contract.pricePerToken();
            await expect(contract.mint(1, {value: price})).to.be.revertedWith("Wallet is not in whitelist");
        });

        it("Should be able to mint in whitelist", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await time.increase(60 * 60);
            await contract.setWhiteList([owner.address]);
            const price = await contract.pricePerToken();
            await contract.mint(1, {value: price});
            expect(await contract.ownerOf(1)).to.be.equal(owner.address);
        });

        it("Should not be able to mint", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            const price = await contract.pricePerToken();
            await expect(contract.mint(1, {value: price})).to.be.revertedWith('Sale not started yet');
        });

        it("Should be reverted because wallet is not in allowlist", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await time.increase(2 * 60 * 60);
            await contract.setWhiteList([owner.address]);
            const price = await contract.pricePerToken();
            await expect(contract.mint(1, {value: price})).to.be.revertedWith("Wallet is not in allowlist");
        });

        it("Should be able to mint in allowlist", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await time.increase(2 * 60 * 60);
            await contract.setWhiteList([owner.address]);
            await contract.setAllowList([owner.address]);
            const price = await contract.pricePerToken();
            await contract.mint(1, {value: price});
            expect(await contract.ownerOf(1)).to.be.equal(owner.address);
        });

        it("Should be able to mint in public mint", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await time.increase(3 * 60 * 60);
            const price = await contract.pricePerToken();
            await contract.mint(1, {value: price});
            expect(await contract.ownerOf(1)).to.be.equal(owner.address);
        });

        it("Should revert because sent ether is incorrect", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await time.increase(3 * 60 * 60);
            const price = await contract.pricePerToken();
            await expect(contract.mint(1, {value: price.div(2)})).to.be.revertedWith("Ether value sent is not correct");
        });


        it("Should return correct available to mint value", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await time.increase(3 * 60 * 60);
            const price = await contract.pricePerToken();

            expect(await contract.availableToMint(owner.address)).to.equal(1);
            await contract.mint(1, {value: price});
            expect(await contract.availableToMint(owner.address)).to.equal(0);
        });

        it("Should revert because token limit exceeded", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await time.increase(3 * 60 * 60);
            const price = await contract.pricePerToken();
            await contract.mint(1, {value: price.mul(1)});
            await expect(contract.mint(1, {value: price})).to.revertedWith("Available token mint count exceeded");
        });

        it("Should not be in whitelist", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            expect(await contract.isWalletWhitelisted(owner.address)).to.be.equal(false);
        });

        it("Should be in whitelist", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await contract.setWhiteList([owner.address]);
            expect(await contract.isWalletWhitelisted(owner.address)).to.be.equal(true);
        });

        it("Should not be in allowlist", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            expect(await contract.isWalletAllowlisted(owner.address)).to.be.equal(false);
        });

        it("Should be in allowlist", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await contract.setAllowList([owner.address]);
            expect(await contract.isWalletAllowlisted(owner.address)).to.be.equal(true);
        });

        it("Should be able to add many wallets to wehitelist", async function () {
            const {
                contract,
                owner,
                otherAccount,
                allowListStart,
                whitelistStart,
                publicStart
            } = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await contract.setWhiteList([...Array(600)].map(_ => owner.address));
            expect(await contract.isWalletWhitelisted(owner.address)).to.be.equal(true);
        });

        it("Should return info", async function () {
            const {
                contract,
                owner,
                allowListStart,
                whitelistStart,
                publicStart
            } = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await contract.setWhiteList([...Array(2)].map(_ => owner.address));

            const info = await contract.info();
            expect(info.stage).to.equal(5);
            expect(info.saleOpen).to.equal(true);
            expect(info.totalMinted).to.equal(0);
            expect(info.waveSupply).to.equal(50);
            expect(info.maxMintCount).to.equal(1);
            expect(info.pricePerToken).to.equal(ethers.utils.parseEther("1"));
            ethers.utils.parseEther("100000000");
        });

        it("Should return correct wallet stage", async function () {
            const {
                contract,
                owner,
                otherAccount,
                allowListStart,
                whitelistStart,
                publicStart
            } = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            let walletStage = await contract.getWalletStage(owner.address);
            expect(walletStage).to.equal(2);
            await contract.setWhiteList([owner.address]);
            walletStage = await contract.getWalletStage(owner.address);
            expect(walletStage).to.equal(0);
            walletStage = await contract.getWalletStage(otherAccount.address);
            expect(walletStage).to.equal(2);
            await contract.setAllowList([otherAccount.address]);
            walletStage = await contract.getWalletStage(otherAccount.address);
            expect(walletStage).to.equal(1);
        });

    });
});
