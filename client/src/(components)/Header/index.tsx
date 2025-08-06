import React from "react";

type Props = {
  name: string;
  buttonComponent?: any;
  isSmallText?: boolean;
};

const Header = ({ name, buttonComponent, isSmallText = false }: Props) => {
  return (
    <div className="relative mb-5 w-full flex items-center justify-center">
      {/* Centered Heading */}
      <h1
        className={`${isSmallText ? "text-lg" : "text-2xl"} font-semibold dark:text-white`}
      >
        {name}
      </h1>

      {/* Button absolutely positioned to the right */}
      {buttonComponent && (
        <div className="absolute right-0">
          {buttonComponent}
        </div>
      )}
    </div>
  );
};

export default Header;
