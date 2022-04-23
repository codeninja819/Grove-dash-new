import { Box, Dialog, useMediaQuery } from "@mui/material";
import React from "react";
import { AiOutlineClose } from "react-icons/ai";
import styled from "styled-components";
import Button from "../../../components/Button";
import { useBridgeDirection } from "../../../hooks/useBridgeDirection";
import { getNetworkLabel } from "../../../utils/helper";

const ClaimErrorModal = ({ onClose, claimErrorShow, claimErrorToken }) => {
  const { foreignChainId } = useBridgeDirection();
  const sm = useMediaQuery("(max-width : 450px)");
  return (
    <Dialog open={claimErrorShow} onClose={onClose}>
      <DialogPanel>
        <DialogHeader p={4}>
          <Box>Transfer done already</Box>
          <AiOutlineClose cursor={"pointer"} onClick={onClose} />
        </DialogHeader>
        <DialogBody px={4} py={0}>
          <Box w="100%">
            <Box as="span">
              The tokens were already claimed. Check your
              {claimErrorToken ? ` ${claimErrorToken.symbol} ` : " "}
              token balance in{" "}
              <strong>{getNetworkLabel(foreignChainId)}</strong>.
            </Box>
          </Box>
        </DialogBody>
        <Box p={4}>
          <Box
            display={"flex"}
            width="100%"
            justifyContent="space-evenly"
            alignItems={sm ? "stretch" : "center"}
            flexDirection={sm ? "column" : "row"}
          >
            <Button
              type={"confirm"}
              width={sm ? "90px" : "120px"}
              height={sm ? "28px" : "50px"}
              fontSize={sm ? "12px" : "16px"}
              onClick={onClose}
            >
              Understood
            </Button>
          </Box>
        </Box>
      </DialogPanel>
    </Dialog>
  );
};

const DialogBody = styled(Box)`
  padding: 15px 20px 30px 20px;
`;

const DialogHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  padding: 20px 20px 17px 20px;
  font-size: 18px;
  font-weight: 600;
  @media screen and (max-width: 450px) {
    font-size: 17px;
  }
`;

const DialogPanel = styled(Box)`
  width: calc(100vw - 40px);
  max-width: 620px;
  color: white;
  background: linear-gradient(
    to bottom,
    rgba(0, 255, 235, 0.2),
    rgba(0, 0, 0, 0)
  );
  border-radius: 10px;
  border: 1px solid rgb(57, 59, 85);
`;

export { ClaimErrorModal };
