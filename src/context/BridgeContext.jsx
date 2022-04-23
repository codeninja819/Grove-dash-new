import { BigNumber, ethers, utils } from "ethers";

import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { bridgeConfig } from "../config/networks";
import { useBridgeDirection } from "../hooks/useBridgeDirection";
import { useMediatorInfo } from "../hooks/useMediatorInfo";
import { fetchToAmount, fetchToToken, relayTokens } from "../lib/bridge/bridge";
import { fetchTokenDetails } from "../lib/bridge/token";
import { getNetworkLabel } from "../utils/helper";
import { useWeb3Context } from "./web3Context";

export const BridgeContext = React.createContext({});

export const useBridgeContext = () => useContext(BridgeContext);

export const BridgeProvider = ({ children }) => {
  const {
    provider: ethersProvider,
    address: account,
    chainID: providerChainId,
    connected: isConnected,
  } = useWeb3Context();

  const { getBridgeChainId, homeChainId, foreignChainId } = useBridgeDirection();

  const [receiver, setReceiver] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [{ fromToken, toToken }, setTokens] = useState({
    fromToken: null,
    toToken: null,
  });
  const [{ fromAmount, toAmount }, setAmounts] = useState({
    fromAmount: BigNumber.from(0),
    toAmount: BigNumber.from(0),
  });
  const [toAmountLoading, setToAmountLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shouldReceiveNativeCur, setShouldReceiveNativeCur] = useState(false);
  const [fromBalance, setFromBalance] = useState(BigNumber.from(0));
  const [toBalance, setToBalance] = useState(BigNumber.from(0));
  const [txHash, setTxHash] = useState();

  const {
    feeManagerAddress,
    isRewardAddress,
    homeToForeignFeeType,
    foreignToHomeFeeType,
    currentDay,
  } = useMediatorInfo();

  const isHome = providerChainId === homeChainId;
  const feeType = isHome ? homeToForeignFeeType : foreignToHomeFeeType;

  const getToAmount = useCallback(
    async (amount) =>
      isRewardAddress
        ? amount
        : fetchToAmount(feeType, fromToken, toToken, amount, feeManagerAddress),
    [fromToken, toToken, isRewardAddress, feeManagerAddress, feeType]
  );

  const cleanAmounts = useCallback(() => {
    setAmountInput("");
    setAmounts({
      fromAmount: BigNumber.from(0),
      toAmount: BigNumber.from(0),
    });
  }, []);

  const setAmount = useCallback(
    async (inputAmount) => {
      if (!fromToken || !toToken) return;
      setToAmountLoading(true);
      const amount = utils.parseUnits(inputAmount === "" ? "0" : inputAmount, fromToken.decimals);
      const gotToAmount = await getToAmount(amount);
      setAmounts({ fromAmount: amount, toAmount: gotToAmount });
      setToAmountLoading(false);
    },
    [fromToken, toToken, getToAmount]
  );

  const setToToken = useCallback(
    (newToToken) => {
      setTokens((prevTokens) => ({
        fromToken: prevTokens.fromToken,
        toToken: { ...newToToken },
      }));
    },
    [setTokens]
  );

  useEffect(() => {
    if (
      fromToken &&
      toToken &&
      fromToken.chainId &&
      toToken.chainId &&
      [homeChainId, foreignChainId].includes(fromToken.chainId) &&
      [homeChainId, foreignChainId].includes(toToken.chainId) &&
      (fromToken.address !== ethers.constants.AddressZero || fromToken.mode === "NATIVE")
    ) {
      const label = getNetworkLabel(fromToken.chainId).toUpperCase();
      const storageKey = `${label}-FROM-TOKEN`;
      localStorage.setItem(storageKey, JSON.stringify(fromToken));
    }
  }, [fromToken, toToken, homeChainId, foreignChainId]);

  const setToken = useCallback(
    async (tokenWithoutMode, isQueryToken = false) => {
      if (!tokenWithoutMode) return false;
      try {
        const [token, gotToToken] = await Promise.all([
          fetchTokenDetails(tokenWithoutMode),
          fetchToToken(tokenWithoutMode, getBridgeChainId(tokenWithoutMode.chainId)),
        ]);
        setTokens({ fromToken: token, toToken: { ...token, ...gotToToken } });
        return true;
      } catch (tokenDetailsError) {
        toast.error(
          !isQueryToken
            ? "Cannot fetch token details. Wait for a few minutes and reload the application"
            : "Token not found."
        );
        console.error({ tokenDetailsError });
        return false;
      }
    },
    [getBridgeChainId]
  );

  const transfer = useCallback(async () => {
    if (!receiver && !account) {
      throw new Error("Must set receiver");
    }
    try {
      setLoading(true);
      setTxHash();
      const tx = await relayTokens(ethersProvider, fromToken, receiver || account, fromAmount, {
        shouldReceiveNativeCur:
          shouldReceiveNativeCur &&
          toToken?.address === ethers.constants.AddressZero &&
          toToken?.mode === "NATIVE",
        foreignChainId,
      });
      setTxHash(tx.hash);
      setAmountInput("0");
      setAmount("0");
    } catch (transferError) {
      setLoading(false);
      console.error({
        transferError,
        fromToken,
        receiver: receiver || account,
        fromAmount: fromAmount.toString(),
        account,
      });
      throw transferError;
    }
  }, [
    fromToken,
    toToken,
    account,
    receiver,
    ethersProvider,
    fromAmount,
    setAmount,
    shouldReceiveNativeCur,
    foreignChainId,
  ]);

  const switchTokens = useCallback(() => {
    setTokens(({ fromToken: from, toToken: to }) => ({
      fromToken: to,
      toToken: from,
    }));
    cleanAmounts();
  }, [cleanAmounts]);

  useEffect(() => {
    if (
      fromToken &&
      toToken &&
      fromToken.chainId &&
      toToken.chainId &&
      [homeChainId, foreignChainId].includes(fromToken.chainId) &&
      [homeChainId, foreignChainId].includes(toToken.chainId) &&
      providerChainId === toToken.chainId
    ) {
      switchTokens();
    }
  }, [homeChainId, foreignChainId, providerChainId, fromToken, toToken, switchTokens]);

  const setDefaultToken = useCallback(
    async (chainId, force = false) => {
      const token =
        chainId === bridgeConfig.homeChainId ? bridgeConfig.homeToken : bridgeConfig.foreignToken;
      if (
        force ||
        !fromToken ||
        (token?.chainId !== fromToken?.chainId && token?.address !== fromToken?.address)
      ) {
        await setToken(token);
      }
    },
    [setToken, fromToken]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      let tokenSet = false;

      const tokensValid =
        fromToken &&
        toToken &&
        [homeChainId, foreignChainId].includes(fromToken?.chainId) &&
        [homeChainId, foreignChainId].includes(toToken?.chainId);

      const chainId = [homeChainId, foreignChainId].includes(providerChainId)
        ? providerChainId
        : foreignChainId;

      if ((isConnected || !account) && !tokenSet && !tokensValid) {
        await setDefaultToken(chainId, !tokensValid);
      }
      cleanAmounts();
      setLoading(false);
    })();
  }, [
    setDefaultToken,
    setToken,
    fromToken,
    toToken,
    homeChainId,
    foreignChainId,
    providerChainId,
    account,
    isConnected,
    cleanAmounts,
  ]);

  useEffect(() => {
    if (
      toToken?.chainId === foreignChainId &&
      toToken?.address === ethers.constants.AddressZero &&
      toToken?.mode === "NATIVE"
    ) {
      setShouldReceiveNativeCur(true);
    } else {
      setShouldReceiveNativeCur(false);
    }
  }, [fromToken, toToken, foreignChainId]);

  const bridgeContext = useMemo(
    () => ({
      // amounts & balances
      amountInput,
      setAmountInput,
      fromAmount,
      toAmount,
      toAmountLoading,
      setAmount,
      fromBalance,
      setFromBalance,
      toBalance,
      setToBalance,
      // tokens
      fromToken,
      toToken,
      setToToken,
      setToken,
      switchTokens,
      // bridge
      transfer,
      loading,
      setLoading,
      txHash,
      setTxHash,
      // misc
      receiver,
      setReceiver,
      shouldReceiveNativeCur,
      setShouldReceiveNativeCur,
      currentDay,
    }),
    [
      // amounts & balances
      amountInput,
      setAmountInput,
      fromAmount,
      toAmount,
      toAmountLoading,
      setAmount,
      fromBalance,
      setFromBalance,
      toBalance,
      setToBalance,
      // tokens
      fromToken,
      toToken,
      setToToken,
      setToken,
      switchTokens,
      // bridge
      transfer,
      loading,
      setLoading,
      txHash,
      setTxHash,
      // misc
      receiver,
      setReceiver,
      shouldReceiveNativeCur,
      setShouldReceiveNativeCur,
      currentDay,
    ]
  );

  return <BridgeContext.Provider value={bridgeContext}>{children}</BridgeContext.Provider>;
};
