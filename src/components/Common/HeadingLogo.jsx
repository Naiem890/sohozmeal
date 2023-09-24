import React from "react";

export default function HeadingLogo(props) {
  return (
    <div>
      <h2 className="uppercase text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        {props.title}
      </h2>
      <p className="uppercase tracking-[0.2em] font-light text-gray-500">
        {props.subTitle}
      </p>
    </div>
  );
}
