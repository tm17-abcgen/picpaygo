import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GalleryImage } from '@/types/gallery';
import { cn } from '@/lib/utils';

type SubseriesPreviewCardProps = {
  title: string;
  to: string;
  images: GalleryImage[];
  className?: string;
};

export function SubseriesPreviewCard({ title, to, images, className }: SubseriesPreviewCardProps) {
  const reduceMotion = useReducedMotion();

  const hero = images[0];
  const stripA = images[1] ?? images[0];
  const stripB = images[2] ?? images[0];
  const stripC = images[3] ?? images[1] ?? images[0];
  const previewObjectPosition = 'object-[center_35%]';

  return (
    <motion.div
      className={cn('w-full h-full', className)}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={reduceMotion ? undefined : { type: 'spring', stiffness: 260, damping: 22 }}
    >
      <Link
        to={to}
        className="group flex h-full flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-[1.75rem]"
      >
        <div className="rounded-[1.75rem] bg-secondary/30 shadow-sm ring-1 ring-border/60 overflow-hidden">
          <div className="p-3">
            <div className="grid grid-cols-3 gap-2 aspect-[5/4]">
              <div className="relative col-span-2 overflow-hidden rounded-2xl">
                {hero && (
                  <motion.img
                    src={hero.src}
                    alt={hero.alt}
                    className={cn('absolute inset-0 h-full w-full object-cover', previewObjectPosition)}
                    loading="lazy"
                    whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                    transition={reduceMotion ? undefined : { duration: 0.35, ease: 'easeOut' }}
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="pointer-events-none absolute bottom-3 left-3 right-3">
                  <p className="text-sm font-medium text-white/90">{title}</p>
                </div>
              </div>

              <div className="grid h-full grid-rows-3 gap-2">
                {[stripA, stripB, stripC].map((img, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'relative overflow-hidden rounded-2xl bg-secondary/40',
                      'transition-transform duration-300 ease-out',
                      idx === 0 && 'group-hover:translate-x-[2px]',
                      idx === 1 && 'group-hover:translate-x-[4px]',
                      idx === 2 && 'group-hover:translate-x-[6px]'
                    )}
                  >
                    {img && (
                      <img
                        src={img.src}
                        alt={img.alt}
                        className={cn('absolute inset-0 h-full w-full object-cover', previewObjectPosition)}
                        loading="lazy"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
