import React, { useCallback } from "react";
import { toast } from "react-toastify"
import { ethers } from "ethers";
import { useWeb3Context } from "../../../context/web3Context";
import { addTokenToMetamask } from "../../../lib/bridge/metamask";
import { getNetworkLabel } from "../../../utils/helper";

import MetamaskFox from "./metamask-fox.svg";

export const AddToMetamask = ({ token, ...props }) => {
  const { chainID: providerChainId, isMetamask } = useWeb3Context();

  const showError = useCallback((msg) => {
    if (msg) toast.error(msg);
  }, []);

  const addToken = useCallback(async () => {
    if (providerChainId !== token.chainId) {
      showError(`Please switch wallet to ${getNetworkLabel(token.chainId)}`);
    } else {
      await addTokenToMetamask(token).catch((metamaskError) => {
        console.error({ metamaskError });
        if (metamaskError && metamaskError.message) {
          showError(
            `Please add the token ${token.address} manually in the wallet app. Got message: "${metamaskError.message}"`
          );
        }
      });
    }
  }, [showError, token, providerChainId]);

  return isMetamask ? (
    <>
      {token.address !== ethers.constants.AddressZero && (
        <img
          cursor="pointer"
          src={MetamaskFox}
          alt="metamask-fox"
          onClick={addToken}
          width="14"
          {...props}
        />
      )}
    </>
  ) : null;
};
