'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

interface ProductImage {
  url: string;
  label?: string;
}

interface ProductImageCarouselProps {
  images: ProductImage[];
  name: string;
}

export default function ProductImageCarousel({ images, name }: ProductImageCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scroll = (dir: 'prev' | 'next') => {
    const el = scrollRef.current;
    if (!el) return;
    const item = el.querySelector<HTMLElement>('[data-carousel-item]');
    if (!item) return;
    el.scrollBy({
      left: dir === 'next' ? item.clientWidth + 12 : -(item.clientWidth + 12),
      behavior: 'smooth',
    });
  };

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const items = el.querySelectorAll<HTMLElement>('[data-carousel-item]');
    if (!items[index]) return;
    el.scrollTo({ left: items[index].offsetLeft, behavior: 'smooth' });
    setActiveIndex(index);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const item = el.querySelector<HTMLElement>('[data-carousel-item]');
    if (!item) return;
    setActiveIndex(Math.round(el.scrollLeft / (item.clientWidth + 12)));
  };

  if (images.length === 0) {
    return (
      <div className="text-border flex aspect-3/4 items-center justify-center rounded-sm bg-white">
        <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="relative aspect-3/4 overflow-hidden rounded-sm bg-white">
        <Image
          src={images[0].url}
          alt={name}
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Carousel + overlaid arrows via CSS grid */}
      <div className="grid">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [grid-area:1/1] [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {images.map((img, i) => (
            <div
              key={i}
              data-carousel-item
              className="relative aspect-3/4 w-[calc(50%-6px)] shrink-0 snap-start overflow-hidden rounded-sm bg-white"
            >
              <Image
                src={img.url}
                alt={img.label || `${name} ${i + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 50vw, 25vw"
                priority={i < 2}
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll('prev')}
          aria-label="Previous image"
          className="z-10 ml-3 flex h-9 w-9 cursor-pointer items-center justify-center self-center justify-self-start rounded-full bg-white/90 shadow-md transition-colors [grid-area:1/1] hover:bg-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={() => scroll('next')}
          aria-label="Next image"
          className="z-10 mr-3 flex h-9 w-9 cursor-pointer items-center justify-center self-center justify-self-end rounded-full bg-white/90 shadow-md transition-colors [grid-area:1/1] hover:bg-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Thumbnail strip */}
      <div
        className="flex gap-2 overflow-x-auto px-px py-px [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => scrollToIndex(i)}
            aria-label={`View image ${i + 1}`}
            className={`relative aspect-3/4 w-14 shrink-0 cursor-pointer overflow-hidden rounded-sm transition-opacity ${
              i === activeIndex ? 'ring-charcoal opacity-100 ring-1' : 'opacity-40 hover:opacity-70'
            }`}
          >
            <Image
              src={img.url}
              alt={`${name} ${i + 1}`}
              fill
              className="object-contain"
              sizes="56px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
