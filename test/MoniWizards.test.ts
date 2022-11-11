import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { generateTree, getProof } from "../scripts/merkleTree";

describe("MoniWizards", function () {

    async function deploy() {
        const [owner, acc1, acc2, acc3, ...accs] = await ethers.getSigners();
        const MoniNFT = await ethers.getContractFactory("MoniWizards");
        const contract = await MoniNFT.deploy("Moni Wizards", "MWIZ", 50, 200, ethers.utils.parseEther("1"));
        const whitelistStart = await time.latest() + 60 * 60;
        const allowListStart = await time.latest() + 2 * 60 * 60;
        const publicStart = await time.latest() + 3 * 60 * 60;
        return {contract, owner, acc1, acc2, acc3, accs, whitelistStart, allowListStart, publicStart};
    }

    describe("Contract tests", function () {
        it("Should revert if sale is not open", async function () {
            const {contract, owner} = await loadFixture(deploy);
            await expect(contract.mint([])).to.be.revertedWith("Sale is closed");
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
                acc1,
                acc2,
                acc3,
                accs,
                allowListStart,
                whitelistStart,
                publicStart
            } = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 2);
            await time.increase(3 * 60 * 60);
            const price = await contract.pricePerToken();
            expect(await contract.stage()).to.be.equal(4);
            await contract.connect(owner).mint([], {value: price});
            let info = await contract.info();
            expect(info.waveSupply).to.be.equal(2);
            expect(info.waveMinted).to.be.equal(1);

            expect(await contract.connect(acc1).mint([], {value: price}));
            info = await contract.info();
            expect(info.waveSupply).to.be.equal(2);
            expect(info.waveMinted).to.be.equal(2);

            await expect(contract.connect(acc2).mint([], {value: price})).to.be.revertedWith("Purchase would exceed wave max tokens");
            info = await contract.info();
            expect(info.waveSupply).to.be.equal(2);
            expect(info.waveMinted).to.be.equal(2);
            expect(await contract.stage()).to.be.equal(6);

            await contract.connect(owner).startWave(whitelistStart + 4 * 60 * 60, allowListStart + 5 * 60 * 60, publicStart + 6 * 60 * 60, 2);
            await time.increase(7 * 60 * 60);
            expect(await contract.stage()).to.be.equal(4);

            await contract.connect(acc3).mint([], {value: price});
            await expect(contract.connect(acc3).mint([], {value: price})).to.be.revertedWith("Already minted");
            await contract.connect(accs[0]).mint([], {value: price});

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
            await expect(contract.mint([], {value: price})).to.be.revertedWith("Wallet is not in whitelist");
        });

        it("Should be able to mint in whitelist", async function () {
            const {
                contract,
                owner,
                acc1,
                acc2,
                acc3,
                allowListStart,
                whitelistStart,
                publicStart
            } = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            const whitelistTree = generateTree([acc1.address, acc2.address]);
            await contract.connect(owner).setMerkleRootWhitelist(whitelistTree.getRoot());
            await time.increase(60 * 60);
            const price = await contract.pricePerToken();
            let proof = getProof(whitelistTree, acc1.address);
            await contract.connect(acc1).mint(proof, {value: price});
            expect(await contract.ownerOf(1)).to.be.equal(acc1.address);


            proof = getProof(whitelistTree, acc2.address);
            await contract.connect(acc2).mint(proof, {value: price});
            expect(await contract.ownerOf(2)).to.be.equal(acc2.address);

            proof = getProof(whitelistTree, acc3.address);
            await expect(contract.connect(acc3).mint(proof, {value: price})).to.be.revertedWith("Wallet is not in whitelist");
        });

        it("Should not be able to mint", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            const price = await contract.pricePerToken();
            await expect(contract.mint([], {value: price})).to.be.revertedWith('Sale not started yet');
        });

        it("Should be reverted because wallet is not in allowlist", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await time.increase(2 * 60 * 60);
            const price = await contract.pricePerToken();
            await expect(contract.mint([], {value: price})).to.be.revertedWith('Wallet is not in allowlist');
        });

        it("Should be able to mint in allowlist", async function () {
            const {
                contract,
                owner,
                acc1,
                acc2,
                allowListStart,
                whitelistStart,
                publicStart
            } = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            const allowListTree = generateTree([acc1.address, acc2.address]);
            await contract.connect(owner).setMerkleRootAllowlist(allowListTree.getRoot());
            await time.increase(2 * 60 * 60);
            const price = await contract.pricePerToken();
            let proof = getProof(allowListTree, acc1.address);
            await contract.connect(acc1).mint(proof, {value: price});
            expect(await contract.ownerOf(1)).to.be.equal(acc1.address);
        });

        it("Should be able to mint in public mint", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await time.increase(3 * 60 * 60);
            const price = await contract.pricePerToken();
            await contract.mint([], {value: price});
            expect(await contract.ownerOf(1)).to.be.equal(owner.address);
        });

        it("Should revert because sent ether is incorrect", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await time.increase(3 * 60 * 60);
            const price = await contract.pricePerToken();
            await expect(contract.mint([], {value: price.div(2)})).to.be.revertedWith("Ether value sent is not correct");
        });


        it("Should show if wallet already minted", async function () {
            const {contract, acc1, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await time.increase(3 * 60 * 60);
            const price = await contract.pricePerToken();
            await contract.connect(acc1).mint([], {value: price});
            expect(await contract.mintRecords(acc1.address)).to.equal(true);
        });

        it("Should revert because token limit exceeded", async function () {
            const {contract, owner, allowListStart, whitelistStart, publicStart} = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await time.increase(3 * 60 * 60);
            const price = await contract.pricePerToken();
            await contract.mint([], {value: price.mul(1)});
            await expect(contract.mint([], {value: price})).to.revertedWith("Already minted");
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

            const info = await contract.info();
            expect(info.stage).to.equal(5);
            expect(info.saleOpen).to.equal(true);
            expect(info.totalMinted).to.equal(0);
            expect(info.waveSupply).to.equal(50);
            expect(info.pricePerToken).to.equal(ethers.utils.parseEther("1"));
            ethers.utils.parseEther("100000000");
        });

        it("test tree regeneration", async function () {
            const {
                contract,
                owner,
                acc1,
                acc2,
                acc3,
                allowListStart,
                whitelistStart,
                publicStart
            } = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            let whitelistTree = generateTree([acc1.address, acc2.address, acc3.address]);
            await contract.connect(owner).setMerkleRootWhitelist(whitelistTree.getRoot());
            await time.increase(60 * 60);
            const price = await contract.pricePerToken();
            whitelistTree = generateTree([acc1.address, acc2.address, acc3.address]);
            let proof = getProof(whitelistTree, acc1.address);
            await contract.connect(acc1).mint(proof, {value: price});
            expect(await contract.ownerOf(1)).to.be.equal(acc1.address);
        });

        it("Should be able to mint in claimlist", async function () {
            const {
                contract,
                owner,
                acc1,
                acc2,
                allowListStart,
                whitelistStart,
                publicStart
            } = await loadFixture(deploy);
            await contract.connect(owner).setSaleOpen();
            await contract.startWave(whitelistStart, allowListStart, publicStart, 50);
            await contract.connect(owner).addToClaimlist([acc1.address]);
            await contract.connect(acc1).claim();
            expect(await contract.ownerOf(1)).to.be.equal(acc1.address);
            await expect(contract.connect(acc2).claim()).to.be.revertedWith("Wallet is not in claim list");
        });


    });
});
