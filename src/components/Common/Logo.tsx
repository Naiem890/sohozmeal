import HeadingLogo from "./HeadingLogo";

interface LogoProps {
  logo?: string;
  alt?: string;
  title?: string;
  subTitle?: string;
}

export default function Logo(props: LogoProps) {
  return (
    <div className="flex items-center gap-4 md:gap-5 flex-wrap">
      {props.logo && (
        <img className="h-16 image" src={props.logo} alt={props?.alt} />
      )}
      <HeadingLogo title={props?.title} subTitle={props?.subTitle} />
    </div>
  );
}
