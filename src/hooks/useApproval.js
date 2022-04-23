import { BigNumber } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { useWeb3Context } from "../context/web3Context";
import { approveToken, fetchAllowance } from "../lib/bridge/token";

export const useApproval = (fromToken, fromAmount, txHash) => {
  const {
    address: account,
    provider: ethersProvider,
    chainID: providerChainId,
  } = useWeb3Context();
  const [allowance, setAllowance] = useState(BigNumber.from(0));
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    if (fromToken && providerChainId === fromToken.chainId) {
      fetchAllowance(fromToken, account, ethersProvider).then(setAllowance);
    } else {
      setAllowance(BigNumber.from(0));
    }
  }, [ethersProvider, account, fromToken, providerChainId, txHash]);

  useEffect(() => {
    if (!fromToken || !fromAmount) {
      setAllowed(false);
      return;
    }
    setAllowed(allowance.gte(fromAmount));
  }, [fromAmount, allowance, fromToken]);

  const [unlockLoading, setUnlockLoading] = useState(false);
  const [approvalTxHash, setApprovalTxHash] = useState();

  const approve = useCallback(async () => {
    setUnlockLoading(true);
    const approvalAmount = fromAmount;
    try {
      const tx = await approveToken(ethersProvider, fromToken, approvalAmount);
      setApprovalTxHash(tx.hash);
      await tx.wait();
      setAllowance(approvalAmount);
    } catch (approveError) {
      if (approveError?.code === "TRANSACTION_REPLACED") {
        if (approveError.cancelled) {
          throw new Error("transaction was replaced");
        } else {
          console.debug("TRANSACTION_REPLACED");
          setApprovalTxHash(approveError.replacement.hash);
          try {
            await approveError.replacement.wait();
            setAllowance(approvalAmount);
          } catch (secondApprovalError) {
            console.error({
              secondApprovalError,
              fromToken,
              approvalAmount: approvalAmount.toString(),
              account,
            });
            throw secondApprovalError;
          }
        }
      } else {
        console.error({
          approveError,
          fromToken,
          approvalAmount: approvalAmount.toString(),
          account,
        });
        throw approveError;
      }
    } finally {
      setApprovalTxHash();
      setUnlockLoading(false);
    }
  }, [fromAmount, fromToken, ethersProvider, account]);

  return { allowed, unlockLoading, approvalTxHash, approve };
};
