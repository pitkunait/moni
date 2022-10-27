import { MerkleTree } from "merkletreejs";
import { ethers } from "ethers";


export const getAddressPacked = (address: string) => ethers.utils.solidityPack(['address'], [address]);

export const generateTree = (data: string[]) => {
    const leaves = data.map(getAddressPacked);
    return new MerkleTree(
        leaves,
        ethers.utils.keccak256,
        {
            hashLeaves: true, // just does not work if false
            sortPairs: true // if false, can not regenerate the same tree from same data
        }
    );
};

export const getProof = (tree: MerkleTree, account: string) => tree.getHexProof(ethers.utils.keccak256(account));
