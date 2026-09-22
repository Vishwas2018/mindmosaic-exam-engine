type StitchFrameProps = {
  src: string;
  title: string;
};

// Stitch screens ship as fully self-contained HTML documents with their own
// Tailwind CDN build + token config, incompatible with the app's own
// Tailwind setup — an iframe keeps the two isolated instead of colliding.
export function StitchFrame({ src, title }: StitchFrameProps) {
  return (
    <iframe
      src={src}
      title={title}
      className="block h-screen w-full border-0"
    />
  );
}
