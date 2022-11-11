import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-etherscan";
import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
    // defaultNetwork: "mumbai",
    solidity: {
        version: "0.8.9",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        hardhat: {},
        mumbai: {
            url: process.env.MUMBAI_API_KEY,
            accounts: [process.env.ACC2_PK!]
        },
        goerli: {
            url: process.env.GOERLI_API_KEY,
            accounts: [process.env.GOERLI_PRIVATE_KEY!]
        },
        'optimism-goerli': {
            url: "https://goerli.optimism.io",
            accounts: [process.env.OPTIMISMGROELI_PRIVATE_KEY!]
        },
    },
    gasReporter: {
        currency: 'USD',
        gasPrice: 30,
        coinmarketcap: '7c509189-8d56-4d3b-9381-4a24b2609ed2',
        enabled: true
    },
    etherscan: {
        apiKey: process.env.POLYGON_API_KEY!
    }
};

export default config;
