'use client';

import React, { useCallback, useEffect, useState } from 'react';
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

  // 2. '이전'/'다음' 버튼을 클릭하는 함수들
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  // 3. 캐러셀 상태가 바뀔 때마다 버튼의 활성화/비활성화 상태를 업데이트
  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

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
    <div className="relative">
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {images.map((img, index) => (
            <div className="embla__slide" key={index}>
              <img
                className="w-full aspect-square object-cover"
                src={img.image_url}
                alt={`${productName} 이미지 ${index + 1}`}
              />
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
    </div>
  );
}