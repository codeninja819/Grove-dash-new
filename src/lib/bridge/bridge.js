import { BigNumber, Contract, ethers } from "ethers";
import { bridgeConfig } from "../../config/networks";
import { getMediatorAddress } from "../../utils/addressHelper";
import { getEthersProvider, getNetworkLabel } from "../../utils/helper";
import { fetchTokenName } from "./token";

const getToName = async (fromToken, toChainId, toAddress) => {
  const { name } = fromToken;
  if (toAddress === ethers.constants.AddressZero) {
    const fromName = name || (await fetchTokenName(fromToken));
    return `${fromName} on ${
      toChainId === 100 ? "GC" : getNetworkLabel(toChainId)
    }`;
  }
  return fetchTokenName({ chainId: toChainId, address: toAddress });
};

const fetchToTokenDetails = async (fromToken, toChainId) => {
  const {
    chainId: fromChainId,
    address: fromAddress,
  } = fromToken;

  const fromMediatorAddress = getMediatorAddress(fromChainId);
  const toMediatorAddress = getMediatorAddress(toChainId);

  const fromEthersProvider = await getEthersProvider(fromChainId);
  const toEthersProvider = await getEthersProvider(toChainId);
  const abi = [
    "function isRegisteredAsNativeToken(address) view returns (bool)",
    "function bridgedTokenAddress(address) view returns (address)",
    "function nativeTokenAddress(address) view returns (address)",
  ];
  const fromMediatorContract = new Contract(
    fromMediatorAddress,
    abi,
    fromEthersProvider
  );
  const isNativeToken = await fromMediatorContract.isRegisteredAsNativeToken(
    fromAddress
  );

  if (isNativeToken) {
    const toMediatorContract = new Contract(
      toMediatorAddress,
      abi,
      toEthersProvider
    );

    const toAddress = await toMediatorContract.bridgedTokenAddress(fromAddress);

    const toName = await getToName(fromToken, toChainId, toAddress);
    return {
      name: toName,
      chainId: toChainId,
      address: toAddress,
      mode: "erc677",
      mediator: toMediatorAddress,
    };
  }
  const toAddress = await fromMediatorContract.nativeTokenAddress(fromAddress);

  const toName = await getToName(fromToken, toChainId, toAddress);
  return {
    name: toName,
    chainId: toChainId,
    address: toAddress,
    mode: "erc20",
    mediator: toMediatorAddress,
  };
};

export const fetchToToken = async (fromToken, toChainId) => {
  const toToken = await fetchToTokenDetails(fromToken, toChainId);
  return toToken;
};

export const fetchToAmount = async (
  feeType,
  fromToken,
  toToken,
  fromAmount,
  feeManagerAddress
) => {
  if (fromAmount.lte(0) || !fromToken || !toToken) return BigNumber.from(0);
  const { homeChainId, homeMediatorAddress } = bridgeConfig;

  const isHome = homeChainId === toToken.chainId;
  const tokenAddress = isHome ? toToken.address : fromToken.address;
  const mediatorAddress = isHome ? toToken.mediator : fromToken.mediator;
  if (
    mediatorAddress !== homeMediatorAddress ||
    !tokenAddress ||
    !feeManagerAddress
  ) {
    return fromAmount;
  }

  try {
    const ethersProvider = await getEthersProvider(homeChainId);
    const abi = [
      "function calculateFee(bytes32, address, uint256) view returns (uint256)",
    ];
    const feeManagerContract = new Contract(
      feeManagerAddress,
      abi,
      ethersProvider
    );

    const fee = await feeManagerContract.calculateFee(
      feeType,
      tokenAddress,
      fromAmount
    );

    return fromAmount.sub(fee);
  } catch (amountError) {
    console.error({ amountError });
    return fromAmount;
  }
};

const getDefaultTokenLimits = async (
  decimals,
  mediatorContract,
  toMediatorContract
) => {
  let [minPerTx, maxPerTx, dailyLimit] = await Promise.all([
    mediatorContract.minPerTx(ethers.constants.AddressZero),
    toMediatorContract.executionMaxPerTx(ethers.constants.AddressZero),
    mediatorContract.executionDailyLimit(ethers.constants.AddressZero),
  ]);

  if (decimals < 18) {
    const factor = BigNumber.from(10).pow(18 - decimals);

    minPerTx = minPerTx.div(factor);
    maxPerTx = maxPerTx.div(factor);
    dailyLimit = dailyLimit.div(factor);

    if (minPerTx.eq(0)) {
      minPerTx = BigNumber.from(1);
      if (maxPerTx.lte(minPerTx)) {
        maxPerTx = BigNumber.from(100);
        if (dailyLimit.lte(maxPerTx)) {
          dailyLimit = BigNumber.from(10000);
        }
      }
    }
  } else {
    const factor = BigNumber.from(10).pow(decimals - 18);

    minPerTx = minPerTx.mul(factor);
    maxPerTx = maxPerTx.mul(factor);
    dailyLimit = dailyLimit.mul(factor);
  }

  return {
    minPerTx,
    maxPerTx,
    remainingLimit: dailyLimit,
    dailyLimit,
  };
};

export const fetchTokenLimits = async (fromToken, toToken, currentDay) => {
  const isDedicatedMediatorToken =
    fromToken.mediator !== getMediatorAddress(fromToken.chainId);

  const abi = isDedicatedMediatorToken
    ? [
        "function getCurrentDay() view returns (uint256)",
        "function minPerTx() view returns (uint256)",
        "function executionMaxPerTx() view returns (uint256)",
        "function dailyLimit() view returns (uint256)",
        "function totalSpentPerDay(uint256) view returns (uint256)",
        "function executionDailyLimit() view returns (uint256)",
        "function totalExecutedPerDay(uint256) view returns (uint256)",
      ]
    : [
        "function getCurrentDay() view returns (uint256)",
        "function minPerTx(address) view returns (uint256)",
        "function executionMaxPerTx(address) view returns (uint256)",
        "function dailyLimit(address) view returns (uint256)",
        "function totalSpentPerDay(address, uint256) view returns (uint256)",
        "function executionDailyLimit(address) view returns (uint256)",
        "function totalExecutedPerDay(address, uint256) view returns (uint256)",
      ];

  try {
    const fromMediatorContract = new Contract(
      fromToken.mediator,
      abi,
      await getEthersProvider(fromToken.chainId)
    );
    const toMediatorContract = new Contract(
      toToken.mediator,
      abi,
      await getEthersProvider(toToken.chainId)
    );

    const { wrappedForeignCurrencyAddress } = bridgeConfig;

    const fromTokenAddress =
      fromToken.address === ethers.constants.AddressZero &&
      fromToken.mode === "NATIVE"
        ? wrappedForeignCurrencyAddress
        : fromToken.address;
    const toTokenAddress =
      toToken.address === ethers.constants.AddressZero &&
      toToken.mode === "NATIVE"
        ? wrappedForeignCurrencyAddress
        : toToken.address;

    if (
      toTokenAddress === ethers.constants.AddressZero ||
      fromTokenAddress === ethers.constants.AddressZero
    )
      return getDefaultTokenLimits(
        fromToken.decimals,
        fromMediatorContract,
        toMediatorContract
      );

    const [
      minPerTx,
      dailyLimit,
      totalSpentPerDay,
      maxPerTx,
      executionDailyLimit,
      totalExecutedPerDay,
    ] = isDedicatedMediatorToken
      ? await Promise.all([
          fromMediatorContract.minPerTx(),
          fromMediatorContract.dailyLimit(),
          fromMediatorContract.totalSpentPerDay(currentDay),
          toMediatorContract.executionMaxPerTx(),
          toMediatorContract.executionDailyLimit(),
          toMediatorContract.totalExecutedPerDay(currentDay),
        ])
      : await Promise.all([
          fromMediatorContract.minPerTx(fromTokenAddress),
          fromMediatorContract.dailyLimit(fromTokenAddress),
          fromMediatorContract.totalSpentPerDay(fromTokenAddress, currentDay),
          toMediatorContract.executionMaxPerTx(toTokenAddress),
          toMediatorContract.executionDailyLimit(toTokenAddress),
          toMediatorContract.totalExecutedPerDay(toTokenAddress, currentDay),
        ]);

    const remainingExecutionLimit =
      executionDailyLimit.sub(totalExecutedPerDay);
    const remainingRequestLimit = dailyLimit.sub(totalSpentPerDay);
    const remainingLimit = remainingRequestLimit.lt(remainingExecutionLimit)
      ? remainingRequestLimit
      : remainingExecutionLimit;

    return {
      minPerTx,
      maxPerTx,
      remainingLimit,
      dailyLimit: dailyLimit.lt(executionDailyLimit)
        ? dailyLimit
        : executionDailyLimit,
    };
  } catch (error) {
    console.error({ tokenLimitsError: error });
    return {
      minPerTx: BigNumber.from(0),
      maxPerTx: BigNumber.from(0),
      remainingLimit: BigNumber.from(0),
      dailyLimit: BigNumber.from(0),
    };
  }
};

export const relayTokens = async (
  ethersProvider,
  token,
  receiver,
  amount,
  { shouldReceiveNativeCur, foreignChainId }
) => {
  const signer = ethersProvider.getSigner();
  const { mode, mediator, address, helperContractAddress } = token;
  switch (mode) {
    case "NATIVE": {
      const abi = [
        "function wrapAndRelayTokens(address _receiver) public payable",
      ];
      const helperContract = new Contract(helperContractAddress, abi, signer);
      return helperContract.wrapAndRelayTokens(receiver, { value: amount });
    }
    // case 'erc677': {
    //   const abi = ['function transferAndCall(address, uint256, bytes)'];
    //   const tokenContract = new Contract(address, abi, signer);
    //   const foreignHelperContract = getHelperContract(foreignChainId);
    //   const bytesData =
    //     shouldReceiveNativeCur && foreignHelperContract
    //       ? `${foreignHelperContract}${receiver.replace('0x', '')}`
    //       : receiver;
    //   return tokenContract.transferAndCall(mediator, amount, bytesData);
    // }
    case "dedicated-erc20": {
      const abi = ["function relayTokens(address, uint256)"];
      const mediatorContract = new Contract(mediator, abi, signer);
      return mediatorContract.relayTokens(receiver, amount);
    }
    case "erc20":
    default: {
      const abi = ["function relayTokens(address, address, uint256)"];
      const mediatorContract = new Contract(mediator, abi, signer);
      return mediatorContract.relayTokens(address, receiver, amount);
    }
  }
};
