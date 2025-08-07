import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel } from 'swiper/modules';
import 'swiper/css';
import './ScrollPicker.css';

export default function ScrollPicker({ count = 10, color = 'red', start = 0, format = (n) => n, onChange }) {
  const numbers = Array.from({ length: count }, (_, i) => start + i);
  const swiperRef = useRef(null);

  const handleSwiper = (swiper) => {
    swiperRef.current = swiper;
    if (onChange) {
      const realIndex = swiper.realIndex;
      onChange(numbers[realIndex]);
    }
  };

  const handleSlideChange = (swiper) => {
    if (onChange) {
      const realIndex = swiper.realIndex;
      onChange(numbers[realIndex]);
    }
  };

  return (
    <div className='ScrollPicker'>
      <Swiper
        onSwiper={handleSwiper}
        onSlideChange={handleSlideChange}
        direction="vertical"
        slidesPerView={3}
        centeredSlides={true}
        spaceBetween={100}
        style={{ height: '70vh', width: '30vw' }}
        grabCursor={true}
        loop={true}
        modules={[Mousewheel]}
        mousewheel={{
          enabled: true,
          sensitivity: 1000,
          thresholdDelta: 50,
          thresholdTime: 5,
        }}
      >
        {numbers.map((num) => (
          <SwiperSlide
            key={num}
            className="slide-number"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '70vh',
              color: color,
              fontWeight: 'normal',
              fontSize: '10vw',
              transition: 'all 0.3s ease',
              userSelect: 'none',
              opacity: 0.4,
            }}
          >
            {format(num)}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
