interface HeadingLogoProps {
  title?: string;
  subTitle?: string;
}

export default function HeadingLogo({ title, subTitle }: HeadingLogoProps) {
  return (
    <div>
      <h2 className="uppercase text-center text-xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="uppercase tracking-[0.2em] text-xs font-light text-muted-foreground text-center mt-0.5">
        {subTitle}
      </p>
    </div>
  );
}
