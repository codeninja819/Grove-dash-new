import { Box } from "@mui/material";
import styled from "styled-components";

function LeftSideBar({ curpage, setCurPage }) {
  const socials = [
    {
      url: "/icons/linkedin.png",
      link: "https://www.linkedin.com/company/grovetoken",
    },
    {
      url: "/icons/discord.png",
      link: "https://discord.com/invite/9ZtspR9Acq",
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
    <>
      <StyledContainer>
        <SocialPanel>
          {socials.map((data, i) => {
            return (
              <Social key={i} href={data.link} target={"_blank"}>
                <img src={data.url} alt={""} />
              </Social>
            );
          })}
        </SocialPanel>
        <Border />
      </StyledContainer>
    </>
  );
}

const Border = styled(Box)`
  position: absolute;
  width: 1px;
  background: #242e45;
  top: -91px;
  right: 0px;
  height: calc(100% + 91px);
`;

const Social = styled.a`
  width: 38px;
  height: 38px;
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
  :hover {
    transform: scale(1.2);
  }
`;

const SocialPanel = styled(Box)`
  height: 100%;
  padding-top: 20px;
`;

const StyledContainer = styled(Box)`
  min-height: 100%;
  padding: 0 25px;
  position: relative;
  @media screen and (max-width: 800px) {
    display: none;
  }
`;

export default LeftSideBar;
