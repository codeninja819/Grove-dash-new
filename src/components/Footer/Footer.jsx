import React from "react";
import styled from "styled-components";
import { Box, useMediaQuery } from "@mui/material";
import Button from "../Button";

const Footer = ({ hamburger }) => {
  const sm = useMediaQuery("(max-width : 680px)");
  const socials = [
    {
      url: "/icons/linkedin.png",
      link: "https://www.linkedin.com/company/grovetoken",
    },
    {
      url: "/icons/discord.png",
      link: "https://discord.com/invite/gWjYGH73pU",
    },
    {
      url: "/icons/youtube.png",
      link: "https://www.youtube.com/watch?v=skA32dgjlIM",
    },
    {
      url: "/icons/reddit.png",
      link: "https://www.reddit.com/user/GroveTokenOfficial",
    },
    {
      url: "/icons/telegram.png",
      link: "https://t.me/Grovetoken",
    },
    {
      url: "/icons/facebook.png",
      link: "https://www.facebook.com/GroveTokenOfficial",
    },
    {
      url: "/icons/instagram.png",
      link: "https://www.instagram.com/grovetoken/?__coig_restricted=1",
    },
    {
      url: "/icons/twitter.png",
      link: "https://twitter.com/GroveToken",
    },
  ];
  return (
    <StyledContainer>
      <a
        href={"https://earn.brewlabs.info/swap"}
        target={"_blank"}
        rel="noreferrer"
      >
        <Button type={"buy"} width={"100%"} height={"50px"}>
          <Box
            display={"flex"}
            minWidth={"33px"}
            minHeight={"33px"}
            maxWidth={"33px"}
            maxHeight={"33px"}
            borderRadius={"50%"}
            border={"1px solid white"}
          >
            <img src={"/logo.png"} width={"100%"} height={"100%"} alt={""} />
          </Box>
          <Box fontWeight={600} ml={"13px"} fontSize={sm ? "14px" : "16px"}>
            Buy Grove Token
          </Box>
        </Button>
      </a>
      <Socials mt={"28px"}>
        {socials.map((data, i) => {
          return (
            <Social key={i} href={data.link} target={"_blank"}>
              <img src={data.url} alt={""} />
            </Social>
          );
        })}
      </Socials>
    </StyledContainer>
  );
};

const Socials = styled(Box)`
  display: flex;
  width: 288px;
  margin: 0 auto;
  justify-content: space-between;
  position: relative;
  z-index: 10;
  @media screen and (min-width: 600px) {
    width: 360px;
  }
`;

const Social = styled.a`
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  text-decoration: none;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.4);
  margin-top: 7px;
  transition: all 0.3s;
  > img {
    transform: scale(0.8);
  }
  :hover {
    transform: scale(1.2);
  }
  @media screen and (min-width: 600px) {
    width: 38px;
    height: 38px;
    transform: scale(1);
  }
`;

const StyledContainer = styled(Box)`
  padding: 0px 25px 25px 25px;
  @media screen and (min-width: 800px) {
    display: none;
  }
`;

export default Footer;
