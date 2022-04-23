import React from "react";
import styled from "styled-components";

const Button = ({
  width,
  height,
  type,
  fontSize = "16px",
  children,
  disabled,
  onClick,
  style,
}) => {
  return (
    <>
      {type === "plus" ? (
        <PlusButton
          width={width}
          height={height}
          type={type}
          fontSize={fontSize}
          disabled={disabled}
          onClick={onClick}
          style={style}
        >
          {children}
        </PlusButton>
      ) : (
        ""
      )}
      {type === "minus" ? (
        <MinusButton
          width={width}
          height={height}
          type={type}
          fontSize={fontSize}
          disabled={disabled}
          onClick={onClick}
          style={style}
        >
          {children}
        </MinusButton>
      ) : (
        ""
      )}
      {type === "primary" ? (
        <PrimaryButton
          width={width}
          height={height}
          type={type}
          fontSize={fontSize}
          disabled={disabled}
          onClick={onClick}
          style={style}
        >
          {children}
        </PrimaryButton>
      ) : (
        ""
      )}
      {type === "secondary" ? (
        <SecondaryButton
          width={width}
          height={height}
          type={type}
          fontSize={fontSize}
          disabled={disabled}
          onClick={onClick}
          style={style}
        >
          {children}
        </SecondaryButton>
      ) : (
        ""
      )}
      {type === "confirm" ? (
        <ConfirmButton
          width={width}
          height={height}
          type={type}
          fontSize={fontSize}
          disabled={disabled}
          onClick={onClick}
          style={style}
        >
          {children}
        </ConfirmButton>
      ) : (
        ""
      )}
      {type === "buy" ? (
        <BuyButton
          width={width}
          height={height}
          type={type}
          fontSize={fontSize}
          disabled={disabled}
          onClick={onClick}
          style={style}
        >
          {children}
        </BuyButton>
      ) : (
        ""
      )}
    </>
  );
};

const BaseButton = styled.button`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "Montserrat";
  font-size: ${({ fontSize }) => fontSize};
  font-weight: bold;
  width: ${({ width }) => width};
  height: ${({ height }) => height};
  box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.16);
  cursor: pointer;
  transition: all 0.3s;
  :disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PlusButton = styled(BaseButton)`
  background: #ebebeb;
  color: #010215;
  border: 1px solid #ebebeb;
  border-radius: 50%;
  line-height: 0px;
  :hover:not([disabled]) {
    background: #ff626e;
    color: white;
    border: #ff626e;
  }
`;

const MinusButton = styled(BaseButton)`
  background: transparent;
  color: white;
  border: 1px solid white;
  border-radius: 50%;
  :hover:not([disabled]) {
    background: #ff626e;
    color: white;
    border: #ff626e;
  }
`;
const PrimaryButton = styled(BaseButton)`
  background: linear-gradient(
    129deg,
    #3e8940 0%,
    #80ab46 50%,
    #e4de4f 82%,
    #ff6600 108%
  );
  color: white;
  border-radius: 5px;
  border: none;
  box-shadow: 0px 0px 15px rgba(98, 255, 0, 0.66);
  :hover:not([disabled]) {
    border: none;
    box-shadow: 0px 0px 15px #00f2ff;
    transform: scale(1.05);
  }
`;
const SecondaryButton = styled(BaseButton)`
  background: #052156;
  border-radius: 5px;
  box-shadow: 0px 0px 15px rgba(62, 186, 221, 0.66);
  :hover:not([disabled]) {
    transform: scale(0.95);
    box-shadow: none;
  }
  @media screen and (max-width: 450px) {
    box-shadow: 0px 0px 10px rgba(62, 186, 221, 0.66);
  }
`;

const ConfirmButton = styled(BaseButton)`
  background: linear-gradient(
    to right,
    #43bad1,
    #43bad1,
    #43bad1,
    #043cb4,
    #0251b3
  );
  color: white;
  transition: all 0.3s ease-in-out;
  font-weight: 700;
  background-size: 300% 100%;
  border: none;
  :hover:not([disabled]) {
    background-position: 100% 0;
    color: white;
    border: none;
  }
  @media screen and (max-width: 550px) {
    font-weight: 500;
  }
`;

const BuyButton = styled(BaseButton)`
  color: white;
  background: transparent;
  z-index: 1;
  border: 2px solid white;
  overflow: hidden;
  border-radius: 5px;
  :before {
    width: ${({ width }) => `calc(${width} + 50px)`};
    transition: 0.3s ease-in-out;
    content: "";
    position: absolute;
    right: -50px;
    border-right: 50px solid transparent;
    border-bottom: ${({ height }) => height} solid white;
    transform: translateX(-100%);
    z-index: -1;
  }
  transition: 0.3s ease-in-out;
  :hover:not([disabled]) {
    color: #01051e;
    :before {
      transform: translateX(0);
    }
  }
`;
export default Button;
