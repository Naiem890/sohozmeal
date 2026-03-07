export default function HeadingLogo({ title, subTitle }) {
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
