import React from "react";
import HeadingLogo from "./HeadingLogo";

export default function Logo(props) {
  return (
    <div className="mt-6 flex items-center gap-6">
      <img className="h-16 image" src={props.logo} alt="Osmany Hall" />
      <HeadingLogo title={props.title} subTitle={props.subTitle} />
    </div>
  );
}
