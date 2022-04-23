import { useMemo } from "react";
import { useBridgeContext } from "../context/BridgeContext";
import { useWeb3Context } from "../context/web3Context";
import { useBridgeDirection } from "./useBridgeDirection";

export const useNeedsClaiming = () => {
  const { chainID: providerChainId } = useWeb3Context();
  const { fromToken } = useBridgeContext();
  const { homeChainId, claimDisabled, tokensClaimDisabled } =
    useBridgeDirection();

  const isHome = providerChainId === homeChainId;

  return useMemo(
    () =>
      isHome &&
      !claimDisabled &&
      !(tokensClaimDisabled ?? []).includes(fromToken?.address.toLowerCase()),
    [isHome, claimDisabled, tokensClaimDisabled, fromToken]
  );
};
