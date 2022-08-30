import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

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
            url: "https://eth-goerli.g.alchemy.com/v2/oJ7c6qJ58omumdnU7XLT0r_-L6BkU_W5",
            accounts: [process.env.RINKEBY_PRIVATE_KEY!]
        },
        rinkeby: {
            url: "https://eth-rinkeby.alchemyapi.io/v2/7MyElH15sfKXQPf4HhENRvj0byrKa5N6",
            accounts: [process.env.GROELI_PRIVATE_KEY!]
        }
    },
};

export default config;
