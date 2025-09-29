'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import useEmblaCarousel, { EmblaCarouselType } from 'embla-carousel-react';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import '../app/carousel.css'; // 1. 방금 만든 CSS 파일을 import 합니다.

type PropType = {
  images: { image_url: string }[];
  productName: string;
}

export default function ProductImageCarousel({ images, productName }: PropType) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 2. '이전'/'다음' 버튼을 클릭하는 함수들
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  // 3. 캐러셀 상태가 바뀔 때마다 버튼의 활성화/비활성화 상태를 업데이트
  const onSelect = useCallback((api: EmblaCarouselType) => {
    setPrevBtnDisabled(!api.canScrollPrev());
    setNextBtnDisabled(!api.canScrollNext());
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  const handleSelectThumb = (index: number) => () => {
    if (!emblaApi) return;
    emblaApi.scrollTo(index);
  };

  // 이미지가 없을 때의 UI
  if (!images || images.length === 0) {
    return (
      <div className="bg-slate-700 w-full aspect-square flex items-center justify-center rounded-md">
        <Camera className="w-24 h-24 text-slate-500" />
      </div>
    );
  }

  // 캐러셀 UI
  return (
    <div className="relative space-y-3">
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {images.map((img, index) => (
            <div className="embla__slide" key={index}>
              <div className="relative w-full aspect-square">
                <Image
                  src={img.image_url}
                  alt={`${productName} 이미지 ${index + 1}`}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* '이전' 버튼 */}
      <button
        className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/75 disabled:opacity-30 transition-all"
        onClick={scrollPrev}
        disabled={prevBtnDisabled}
      >
        <ChevronLeft size={24} />
      </button>

      {/* '다음' 버튼 */}
      <button
        className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/75 disabled:opacity-30 transition-all"
        onClick={scrollNext}
        disabled={nextBtnDisabled}
      >
        <ChevronRight size={24} />
      </button>

      {images.length > 1 && (
        <div className="mt-2 flex justify-center gap-3">
          {images.slice(0, 5).map((image, index) => {
            const isActive = selectedIndex === index;
            return (
              <button
                key={image.image_url + index}
                type="button"
                onClick={handleSelectThumb(index)}
                className={`relative h-16 w-16 overflow-hidden rounded-md border transition-colors ${
                  isActive
                    ? 'border-primary ring-2 ring-primary/60'
                    : 'border-slate-600 hover:border-primary/60'
                }`}
                aria-label={`${productName} 이미지 ${index + 1} 보기`}
                aria-current={isActive}
              >
                <Image
                  src={image.image_url}
                  alt={`${productName} 미리보기 ${index + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
