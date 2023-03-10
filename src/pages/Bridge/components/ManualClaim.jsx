import { Box, Dialog, useMediaQuery } from "@mui/material";
import { isRevertedError, TOKENS_CLAIMED } from "../../../lib/bridge/amb";
import { handleWalletError } from "../../../utils/helpers";
import React, { useCallback, useState } from "react";
import { useWeb3Context } from "../../../context/web3Context";
import { useClaim } from "../../../hooks/useClaim";
import { toast } from "react-toastify";

export const ManualClaim = ({ handleClaimError }) => {
  const { isConnected } = useWeb3Context();
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const { claim, executing } = useClaim();

  const showError = useCallback((msg) => {
    if (msg) toast.error(msg);
  }, []);

  const claimTokens = useCallback(async () => {
    if (!txHash) return;
    setLoading(true);
    try {
      await claim(txHash);
      setTxHash("");
    } catch (manualClaimError) {
      logError({ manualClaimError });
      if (
        manualClaimError?.message === TOKENS_CLAIMED ||
        isRevertedError(manualClaimError)
      ) {
        setTxHash("");
        handleClaimError();
      } else {
        handleWalletError(manualClaimError, showError);
      }
    } finally {
      setLoading(false);
    }
  }, [claim, txHash, showError, handleClaimError]);

  if (!isConnected) return null;

  return (
    <Box
    display="flex"
      width="100%"
      justifyContent="space-between"
      mb="4"
      alignItems="center"
      bg="white"
      p="1rem"
      borderRadius="0.5rem"
      boxShadow="0px 1rem 2rem rgba(204, 218, 238, 0.8)"
      direction={{ base: "column", lg: "row" }}
    >
      <Flex
        direction="column"
        fontSize="sm"
        w="100%"
        minW={{ base: "auto", lg: "25rem" }}
        mb={{ base: "2", lg: "0" }}
      >
        <Text color="black">
          Can&apos;t find your transfer to claim tokens?
        </Text>
        <Text color="greyText">
          Enter the transaction hash where the token transfer happened{" "}
        </Text>
      </Flex>
      <InputGroup>
        <Input
          borderColor="#DAE3F0"
          bg="white"
          fontSize="sm"
          placeholder="Transaction Hash"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          pr="6rem"
        />
        <InputRightElement minW="5rem" pr={1}>
          <Button
            w="100%"
            size="sm"
            colorScheme="blue"
            onClick={claimTokens}
            isDisabled={!txHash}
            isLoading={loading || executing}
          >
            Claim
          </Button>
        </InputRightElement>
      </InputGroup>
    </Box>
  );
};
