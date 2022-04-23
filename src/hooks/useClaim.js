import { useBridgeDirection } from "../hooks/useBridgeDirection";
import { executeSignatures, TOKENS_CLAIMED } from "../lib/bridge/amb";
import {
  getNetworkLabel,
  getEthersProvider,
  handleWalletError,
} from "../utils/helper";
import {
  getMessage,
  getRemainingSignatures,
  messageCallStatus,
} from "../lib/bridge/message";
import { addChainToMetaMask } from "../lib/bridge/metamask";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useWeb3Context } from "../context/web3Context";

const useExecution = () => {
  const { foreignChainId, foreignAmbAddress, foreignAmbVersion } =
    useBridgeDirection();
  const {
    chainID: providerChainId,
    provider: ethersProvider,
    isMetamask,
  } = useWeb3Context();
  const [doRepeat, setDoRepeat] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [message, setMessage] = useState();
  const [txHash, setTxHash] = useState();

  const showError = useCallback((msg) => {
    if (msg) toast.error(msg);
  }, []);

  const switchChain = useCallback(
    async (chainId) => {
      const result = await addChainToMetaMask(chainId).catch(
        (metamaskError) => {
          console.error({ metamaskError });
          handleWalletError(metamaskError, showError);
        }
      );
      return result;
    },
    [showError]
  );

  const isRightNetwork = providerChainId === foreignChainId;

  const executeCallback = useCallback(
    async (msgData) => {
      try {
        setExecuting(true);
        if (!isRightNetwork) {
          if (isMetamask) {
            const success = await switchChain(foreignChainId);
            if (success) {
              setMessage(msgData);
              setDoRepeat(true);
              return;
            }
          }
          showError(
            `Wrong network. Please connect your wallet to ${getNetworkLabel(
              foreignChainId
            )}.`
          );
        } else {
          console.log("executeSignatures", msgData);
          const tx = await executeSignatures(
            ethersProvider,
            foreignAmbAddress,
            foreignAmbVersion,
            msgData
          );
          await tx.wait();
          setTxHash(tx.hash);
        }
      } catch (claimError) {
        if (claimError?.code === "TRANSACTION_REPLACED") {
          if (claimError.cancelled) {
            throw new Error("transaction was replaced");
          } else {
            console.debug("TRANSACTION_REPLACED");
            await claimError.replacement.wait();
            setTxHash(claimError.replacement.hash);
          }
        } else {
          throw claimError;
        }
      } finally {
        setExecuting(false);
      }
    },
    [
      ethersProvider,
      isMetamask,
      foreignChainId,
      foreignAmbVersion,
      foreignAmbAddress,
      showError,
      switchChain,
      isRightNetwork,
    ]
  );

  useEffect(() => {
    if (isRightNetwork && doRepeat && !!message) {
      executeCallback(message);
      setDoRepeat(false);
      setMessage();
    }
  }, [executeCallback, doRepeat, message, isRightNetwork]);

  return { executeCallback, executing, executionTx: txHash };
};

export const useClaim = () => {
  const {
    homeChainId,
    homeAmbAddress,
    foreignChainId,
    foreignAmbAddress,
    requiredSignatures,
    validatorList,
  } = useBridgeDirection();
  const { chainID: providerChainId, isMetamask } = useWeb3Context();
  const { executeCallback, executing, executionTx } = useExecution();

  const claim = useCallback(
    async (txHash, txMessage) => {
      if (providerChainId !== foreignChainId && !isMetamask) {
        throw Error(
          `Wrong network. Please connect your wallet to ${getNetworkLabel(
            foreignChainId
          )}.`
        );
      }
      let message =
        txMessage && txMessage.messageData && txMessage.signatures
          ? txMessage
          : null;
      if (!message) {
        const homeProvider = await getEthersProvider(homeChainId);
        message = await getMessage(true, homeProvider, homeAmbAddress, txHash);
      }
      message.signatures = getRemainingSignatures(
        message.messageData,
        message.signatures,
        requiredSignatures,
        validatorList
      );
      const foreignProvider = await getEthersProvider(foreignChainId);
      const claimed = await messageCallStatus(
        foreignAmbAddress,
        foreignProvider,
        message.messageId
      );
      if (claimed) {
        throw Error(TOKENS_CLAIMED);
      }
      return executeCallback(message);
    },
    [
      executeCallback,
      homeChainId,
      homeAmbAddress,
      foreignChainId,
      foreignAmbAddress,
      providerChainId,
      isMetamask,
      requiredSignatures,
      validatorList,
    ]
  );

  return { claim, executing, executionTx };
};
