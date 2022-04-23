export const CHAINS = {
  1: {
    chainId: 1,
    chainName: "ETH Mainnet",
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ["https://eth-mainnet.alchemyapi.io/v2/jSAxMXjNt1jV6IyvZc0Z8BsiM9tOivpQ"],
    blockExplorerUrls: "https://etherscan.io",
  },
  56: {
    chainId: 56,
    chainName: "BNB Smart Chain",
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: [
      "https://bsc-dataseed.binance.org",
      "https://bsc-dataseed1.binance.org",
    ],
    blockExplorerUrls: "https://bscscan.com",
  },
};

export const CHAIN_ICONS = {
  1: '/icons/etherscan.png',
  4: '/icons/etherscan.png',
  56: '/icons/bscscan.png',
  97: '/icons/bscscan.png',
}

export const tokens = {
  1: {
    address: '0x84FA8f52E437Ac04107EC1768764B2b39287CB3e',
    chainId: 1,
    symbol: 'GVR',
    name: 'Grove Token',
  },
  56: {
    address: '0xaFb64E73dEf6fAa8B6Ef9a6fb7312d5C4C15ebDB',
    chainId: 56,
    symbol: 'GVR',
    name: 'Grove Token',
  }
}

export const bridgeConfig = {
  homeChainId: 1,
  foreignChainId: 56,
  homeToken: tokens[1],
  foreignToken: tokens[56],
  enableForeignCurrencyBridge: false,
  homeWrappedForeignCurrencyAddress: null,
  wrappedForeignCurrencyAddress: null,
  foreignMediatorAddress:
    "0x48fE4B97004E21E2cE7123D5C215c4eA4D9B4eDB".toLowerCase(),
  homeMediatorAddress:
    "0x35C9352AB9bF2313FE87Ee18E1352F5cb9BAeb25".toLowerCase(),
  foreignAmbAddress: "0x0Cf3e760d33d3d11482DC4EA79F23EA62783c06c".toLowerCase(),
  homeAmbAddress: "0xBeb1840DE0E2440576BDC10D60b12B3832922060".toLowerCase(),
  foreignGraphName: "brainstormk/grove-bridge-bsc",
  homeGraphName: "brainstormk/grove-bridge-mainnet",
  ambLiveMonitorPrefix: "http://alm-bsc.herokuapp.com",
  claimDisabled: false,
  tokensClaimDisabled: [],
};
