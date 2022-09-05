import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import dotenv from "dotenv";

dotenv.config()

const config: HardhatUserConfig = {
    defaultNetwork: "rinkeby",
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
        groeli: {
            url: process.env.GROELI_API_KEY,
            accounts: [process.env.GROELI_PRIVATE_KEY!]
        },
        rinkeby: {
            url: process.env.RINKEBY_API_KEY,
            accounts: [process.env.RINKEBY_PRIVATE_KEY!]
        }
    },
    gasReporter: {
        currency: 'USD',
        gasPrice: 30,
        enabled: true
    }
};

export default config;
