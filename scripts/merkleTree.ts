import { MerkleTree } from "merkletreejs";
import { ethers } from "ethers";


export const getAddressPacked = (address: string) => ethers.utils.solidityPack(['address'], [address]);

export const generateTree = (data: string[]) => {
    const leaves = data.map(address => getAddressPacked(address));
    return new MerkleTree(leaves, ethers.utils.keccak256, {hashLeaves: true, sortPairs: true});
};

export const getProof = (tree: MerkleTree, account: string) => tree.getHexProof(ethers.utils.keccak256(account));
