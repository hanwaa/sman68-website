export default function PhotoBackdrop({
  src,
  overlayClassName,
}: {
  src: string;
  overlayClassName: string;
}) {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden lg:hidden" aria-hidden="true">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center blur-[2px]"
          style={{ backgroundImage: `url('${src}')` }}
        />
        <div className={`absolute inset-0 ${overlayClassName}`} />
      </div>

      <div
        className="bg-fixed-photo absolute inset-0 hidden lg:block"
        style={{ backgroundImage: `url('${src}')` }}
        aria-hidden="true"
      >
        <div className={`absolute inset-0 ${overlayClassName}`} />
      </div>
    </>
  );
}
