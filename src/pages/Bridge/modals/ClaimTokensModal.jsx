import { Box, Dialog, useMediaQuery } from "@mui/material";
import React, { useEffect, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { Link } from "react-router-dom";
import styled from "styled-components";

import Button from "../../../components/Button";
import { useClaimableTransfers } from "../../../hooks/useClaimableTransfers";
import { LoadingModal } from "./LoadingModal";

const DONT_SHOW_CLAIMS = "dont-show-claims";

export const ClaimTokensModal = () => {
  const { transfers, loading } = useClaimableTransfers();
  const [isOpen, setOpen] = useState(false);

  const sm = useMediaQuery("(max-width : 450px)");

  const onClose = () => {
    setOpen(false);
    window.localStorage.setItem(DONT_SHOW_CLAIMS, "true");
  };

  useEffect(() => {
    const dontShowClaims =
      window.localStorage.getItem(DONT_SHOW_CLAIMS) === "true";
    setOpen(!!transfers && transfers.length > 0 && !dontShowClaims);
  }, [transfers]);

  if (loading) return <LoadingModal />;

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogPanel>
        <DialogHeader p={4}>
          <Box>Claim Your Tokens</Box>
          <AiOutlineClose cursor={"pointer"} onClick={onClose} />
        </DialogHeader>
        <DialogBody px={4} mb={2}>
          <Box width="100%">
            <Box as="span">{`You have `}</Box>
            <Box as="b">{transfers ? transfers.length : 0}</Box>
            <Box as="span">{` not claimed transactions `}</Box>
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
              type={"secondary"}
              width={sm ? "90px" : "120px"}
              height={sm ? "28px" : "50px"}
              fontSize={sm ? "12px" : "16px"}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Link
              to="/history"
              display="flex"
              onClick={() => {
                window.localStorage.setItem("dont-show-claims", "false");
              }}
            >
              <Button
                type={"primary"}
                width={sm ? "90px" : "120px"}
                height={sm ? "28px" : "50px"}
                fontSize={sm ? "12px" : "16px"}
              >
                Claim
              </Button>
            </Link>
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
