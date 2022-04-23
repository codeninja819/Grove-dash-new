import { useBridgeContext } from "../context/BridgeContext";
import { fetchTokenLimits } from "../lib/bridge/bridge";
import { useBridgeDirection } from "./useBridgeDirection";

const { useState, useCallback, useEffect } = require("react");

export const useTokenLimits = () => {
  const { fromToken, toToken, currentDay } = useBridgeContext();
  const { homeChainId, foreignChainId } = useBridgeDirection();
  const [tokenLimits, setTokenLimits] = useState();
  const [fetching, setFetching] = useState(false);

  const updateTokenLimits = useCallback(async () => {
    if (
      fromToken &&
      toToken &&
      fromToken.chainId &&
      toToken.chainId &&
      (fromToken.symbol.includes(toToken.symbol) ||
        toToken.symbol.includes(fromToken.symbol)) &&
      [homeChainId, foreignChainId].includes(fromToken.chainId) &&
      [homeChainId, foreignChainId].includes(toToken.chainId) &&
      currentDay
    ) {
      setFetching(true);
      const limits = await fetchTokenLimits(fromToken, toToken, currentDay);
      setTokenLimits(limits);
      setFetching(false);
    }
  }, [fromToken, toToken, homeChainId, foreignChainId, currentDay]);

  useEffect(() => {
    updateTokenLimits();
  }, [updateTokenLimits]);

  return { tokenLimits, fetching, refresh: updateTokenLimits };
};
