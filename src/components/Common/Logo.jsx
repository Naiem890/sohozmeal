import React from "react";
import HeadingLogo from "./HeadingLogo";

export default function Logo(props) {
  return (
    <div className="flex items-center gap-6">
      {props.image && (
        <img className="h-16 image" src={props.logo} alt="Osmany Hall" />
      )}
      <HeadingLogo title={props.title} subTitle={props.subTitle} />
    </div>
  );
}
