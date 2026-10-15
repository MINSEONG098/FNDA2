/**
 * [이마트 센트럴점] 간편식 20% 프로모션 웹페이지 통합 스크립트 (app.js)
 * - 내 맘대로 조합 계산기 로직 (실시간 20% 할인 & 1끼 환산가)
 * - 매일 낮 12:00 선착순 20세트 타임어택 카운트다운 타이머
 * - 카드뉴스 6종 캐러셀 슬라이더 & 라이트박스 확대 뷰어
 * - FAQ 아코디언, 알림 예약 모달, 공유하기 및 토스트 시스템
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. DATA: 상품 마스터 및 초기 장바구니 상태
  // =========================================================================
  const PRODUCTS = {
    bulgogi: {
      id: 'bulgogi',
      name: '한끼 소불고기덮밥',
      price: 5900,
      qty: 1,
      badge: '든든 밥류'
    },
    chicken: {
      id: 'chicken',
      name: '매콤 닭갈비볶음밥',
      price: 5500,
      qty: 1,
      badge: '매콤 밥류'
    },
    duck_wrap: {
      id: 'duck_wrap',
      name: '훈제오리 샐러드랩',
      price: 6200,
      qty: 0,
      badge: '신선 샐러드랩'
    }
  };

  // Preset Configurations
  const PRESETS = {
    hearty: { bulgogi: 1, chicken: 1, duck_wrap: 0 },
    balanceA: { bulgogi: 1, chicken: 0, duck_wrap: 1 },
    balanceB: { bulgogi: 0, chicken: 1, duck_wrap: 1 },
    light: { bulgogi: 0, chicken: 0, duck_wrap: 2 },
    reset: { bulgogi: 0, chicken: 0, duck_wrap: 0 }
  };

  // DOM Elements - Calculator
  const billItemSummary = document.getElementById('billItemSummary');
  const totalQtyVal = document.getElementById('totalQtyVal');
  const originalPriceVal = document.getElementById('originalPriceVal');
  const discountAmountVal = document.getElementById('discountAmountVal');
  const finalPayVal = document.getElementById('finalPayVal');
  const perMealBadge = document.getElementById('perMealBadge');
  const perMealPriceVal = document.getElementById('perMealPriceVal');
  const billConditionAlert = document.getElementById('billConditionAlert');
  const discountRow = document.getElementById('discountRow');

  // =========================================================================
  // 2. CALCULATOR ENGINE
  // =========================================================================
  function updateCalculator() {
    let totalQty = 0;
    let originalTotal = 0;

    // Update quantities in UI and calculate sum
    Object.keys(PRODUCTS).forEach(key => {
      const prod = PRODUCTS[key];
      const qtyElem = document.getElementById(`qty-${key}`);
      if (qtyElem) {
        qtyElem.textContent = prod.qty;
      }
      totalQty += prod.qty;
      originalTotal += (prod.price * prod.qty);
    });

    // Populate Item Summary Lines
    billItemSummary.innerHTML = '';
    let selectedCount = 0;

    Object.keys(PRODUCTS).forEach(key => {
      const prod = PRODUCTS[key];
      if (prod.qty > 0) {
        selectedCount++;
        const line = document.createElement('div');
        line.className = 'bill-item-line';
        line.innerHTML = `
          <span>${prod.name} × ${prod.qty}개</span>
          <span>${(prod.price * prod.qty).toLocaleString()}원</span>
        `;
        billItemSummary.appendChild(line);
      }
    });

    if (selectedCount === 0) {
      billItemSummary.innerHTML = '<div style="color: var(--color-text-muted); text-align: center; padding: 6px 0;">담긴 상품이 없습니다. 상품을 선택해 주세요.</div>';
    }

    // Total Qty
    totalQtyVal.textContent = `${totalQty}개`;
    originalPriceVal.textContent = `${originalTotal.toLocaleString()}원`;

    // Discount Calculation Rule: Total items >= 2 gives 20% discount
    if (totalQty >= 2) {
      const discountAmount = Math.round(originalTotal * 0.20);
      const finalPrice = originalTotal - discountAmount;
      const perMeal = Math.round(finalPrice / totalQty);

      discountRow.style.display = 'flex';
      discountAmountVal.textContent = `-${discountAmount.toLocaleString()}원`;
      finalPayVal.textContent = finalPrice.toLocaleString();

      perMealBadge.style.display = 'flex';
      perMealPriceVal.textContent = `약 ${perMeal.toLocaleString()}원`;

      billConditionAlert.className = 'bill-condition-alert';
      billConditionAlert.innerHTML = `🎉 <strong>20% 즉시 할인 적용!</strong> 전 조합 1만 원 이하 혜택`;
    } else if (totalQty === 1) {
      discountRow.style.display = 'none';
      finalPayVal.textContent = originalTotal.toLocaleString();
      perMealBadge.style.display = 'none';

      billConditionAlert.className = 'bill-condition-alert warning';
      billConditionAlert.innerHTML = `👉 <strong>1개 더 담으시면</strong> 전체 금액에서 <strong>20% 즉시 할인</strong>됩니다!`;
    } else {
      discountRow.style.display = 'none';
      finalPayVal.textContent = '0';
      perMealBadge.style.display = 'none';

      billConditionAlert.className = 'bill-condition-alert';
      billConditionAlert.innerHTML = `💡 원하는 간편식 2개 이상 선택 시 20% 할인이 적용됩니다.`;
    }
  }

  // Handle Qty Plus / Minus
  document.querySelectorAll('.calc-product-card').forEach(card => {
    const id = card.dataset.id;
    const btnMinus = card.querySelector('.btn-qty.minus');
    const btnPlus = card.querySelector('.btn-qty.plus');

    btnMinus.addEventListener('click', () => {
      if (PRODUCTS[id].qty > 0) {
        PRODUCTS[id].qty--;
        clearActivePresets();
        updateCalculator();
      }
    });

    btnPlus.addEventListener('click', () => {
      if (PRODUCTS[id].qty < 10) {
        PRODUCTS[id].qty++;
        clearActivePresets();
        updateCalculator();
      }
    });
  });

  // Handle Preset Buttons
  function applyPreset(presetKey) {
    if (!PRESETS[presetKey]) return;
    const config = PRESETS[presetKey];
    Object.keys(config).forEach(key => {
      PRODUCTS[key].qty = config[key];
    });

    document.querySelectorAll('.btn-preset').forEach(btn => {
      if (btn.dataset.preset === presetKey && presetKey !== 'reset') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    updateCalculator();
  }

  function clearActivePresets() {
    document.querySelectorAll('.btn-preset').forEach(btn => btn.classList.remove('active'));
  }

  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      applyPreset(btn.dataset.preset);
    });
  });

  // Handle Curation Cards "이 조합 담아보기"
  document.querySelectorAll('.btn-curation-apply').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.dataset.preset;
      applyPreset(presetKey);

      const target = document.getElementById('calculatorSection');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }

      showToast('🛒 선택하신 추천 세트가 계산기에 적용되었습니다!', '✨');
    });
  });

  // Scroll to store section from bill
  const btnScrollToStore = document.getElementById('btnScrollToStore');
  if (btnScrollToStore) {
    btnScrollToStore.addEventListener('click', () => {
      const storeSection = document.getElementById('storeSection');
      if (storeSection) {
        storeSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Initial Calculation Run
  updateCalculator();


  // =========================================================================
  // 3. TIME-ATTACK COUNTDOWN TIMER (매일 12:00 정각 타깃)
  // =========================================================================
  const hoursVal = document.getElementById('hoursVal');
  const minutesVal = document.getElementById('minutesVal');
  const secondsVal = document.getElementById('secondsVal');
  const timerStatusTitle = document.getElementById('timerStatusTitle');
  const stockRemaining = document.getElementById('stockRemaining');
  const gaugeFill = document.getElementById('gaugeFill');

  function updateCountdown() {
    const now = new Date();
    const target = new Date();

    // Set target time to 12:00:00 today
    target.setHours(12, 0, 0, 0);

    // If already past 12:00 PM
    if (now.getTime() > target.getTime()) {
      const pastHours = (now.getTime() - target.getTime()) / (1000 * 60 * 60);

      // Between 12:00 and 14:00: EVENT IS LIVE NOW!
      if (pastHours <= 2) {
        if (timerStatusTitle) {
          timerStatusTitle.innerHTML = '🔥 <strong style="color: #FF5252;">지금 선착순 20세트 타임어택 진행 중!</strong> (서두르세요!)';
        }
        hoursVal.textContent = '00';
        minutesVal.textContent = '00';
        secondsVal.textContent = '00';
        
        // Simulating hot scarcity
        if (stockRemaining) stockRemaining.textContent = '7';
        if (gaugeFill) gaugeFill.style.width = '35%';
        return;
      } else {
        // After 14:00: target is 12:00 PM tomorrow
        target.setDate(target.getDate() + 1);
        if (timerStatusTitle) {
          timerStatusTitle.textContent = '내일 낮 12:00 선착순 20세트 타임어택까지 남은 시간';
        }
        if (stockRemaining) stockRemaining.textContent = '20';
        if (gaugeFill) gaugeFill.style.width = '100%';
      }
    } else {
      if (timerStatusTitle) {
        timerStatusTitle.textContent = '오늘 낮 12:00 선착순 20세트 타임어택까지 남은 시간';
      }
      if (stockRemaining) stockRemaining.textContent = '20';
      if (gaugeFill) gaugeFill.style.width = '100%';
    }

    const diff = Math.max(0, target.getTime() - now.getTime());
    const h = Math.floor((diff / (1000 * 60 * 60)));
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    hoursVal.textContent = String(h).padStart(2, '0');
    minutesVal.textContent = String(m).padStart(2, '0');
    secondsVal.textContent = String(s).padStart(2, '0');
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();


  // =========================================================================
  // 4. CARD NEWS CAROUSEL (01 ~ 06)
  // =========================================================================
  const cardTrack = document.getElementById('cardTrack');
  const cardSlides = document.querySelectorAll('.card-slide');
  const cardPrevBtn = document.getElementById('cardPrevBtn');
  const cardNextBtn = document.getElementById('cardNextBtn');
  const carouselDots = document.querySelectorAll('.carousel-dots .dot');
  let currentSlide = 0;
  const totalSlides = cardSlides.length;

  function goToSlide(index) {
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;
    currentSlide = index;

    if (cardTrack) {
      cardTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    }

    cardSlides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === currentSlide);
    });

    carouselDots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSlide);
    });
  }

  if (cardPrevBtn) {
    cardPrevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
  }
  if (cardNextBtn) {
    cardNextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
  }

  carouselDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.index, 10);
      goToSlide(idx);
    });
  });

  // Touch Swipe for Mobile
  let touchStartX = 0;
  let touchEndX = 0;
  const trackContainer = document.getElementById('carouselTrackContainer');

  if (trackContainer) {
    trackContainer.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    trackContainer.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }

  function handleSwipe() {
    const threshold = 40;
    if (touchEndX < touchStartX - threshold) {
      goToSlide(currentSlide + 1);
    } else if (touchEndX > touchStartX + threshold) {
      goToSlide(currentSlide - 1);
    }
  }


  // =========================================================================
  // 5. LIGHTBOX MODAL (Image Fullscreen Preview)
  // =========================================================================
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');

  function openLightbox(src, caption) {
    if (!lightboxModal) return;
    lightboxImg.src = src;
    lightboxCaption.textContent = caption || '';
    lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.lightbox-trigger').forEach(img => {
    img.addEventListener('click', () => {
      openLightbox(img.src, img.alt);
    });
  });

  const btnOpenPoster = document.querySelector('.lightbox-trigger-btn');
  if (btnOpenPoster) {
    btnOpenPoster.addEventListener('click', () => {
      openLightbox('./images/poster.png', '이마트 센트럴점 간편식 20% 파격 할인 매장 공식 포스터');
    });
  }

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);


  // =========================================================================
  // 6. ALARM RESERVATION MODAL
  // =========================================================================
  const alarmModal = document.getElementById('alarmModal');
  const alarmCloseBtn = document.getElementById('alarmCloseBtn');
  const alarmBackdrop = document.getElementById('alarmBackdrop');
  const openAlarmModalBtn = document.getElementById('openAlarmModalBtn');
  const btnHeroAlarm = document.getElementById('btnHeroAlarm');
  const alarmForm = document.getElementById('alarmForm');

  function openAlarmModal() {
    if (!alarmModal) return;
    alarmModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeAlarmModal() {
    if (!alarmModal) return;
    alarmModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (openAlarmModalBtn) openAlarmModalBtn.addEventListener('click', openAlarmModal);
  if (btnHeroAlarm) btnHeroAlarm.addEventListener('click', openAlarmModal);
  if (alarmCloseBtn) alarmCloseBtn.addEventListener('click', closeAlarmModal);
  if (alarmBackdrop) alarmBackdrop.addEventListener('click', closeAlarmModal);

  if (alarmForm) {
    alarmForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const phoneInput = document.getElementById('userPhone');
      if (phoneInput && phoneInput.value.trim().length >= 10) {
        closeAlarmModal();
        showToast(`🎉 ${phoneInput.value} 번호로 매일 11:50 사전 알림이 예약되었습니다!`, '🔔');
        alarmForm.reset();
      } else {
        alert('올바른 휴대폰 번호를 입력해 주세요.');
      }
    });
  }


  // =========================================================================
  // 7. FAQ ACCORDION
  // =========================================================================
  document.querySelectorAll('.faq-item').forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close other items
      document.querySelectorAll('.faq-item').forEach(other => {
        if (other !== item) other.classList.remove('open');
      });
      item.classList.toggle('open', !isOpen);
    });
  });


  // =========================================================================
  // 8. MAPS & SHARE ACTIONS
  // =========================================================================
  const btnNaverMap = document.getElementById('btnNaverMap');
  const btnKakaoMap = document.getElementById('btnKakaoMap');
  const btnCopyAddress = document.getElementById('btnCopyAddress');
  const btnShareKakao = document.getElementById('btnShareKakao');
  const btnFooterShare = document.getElementById('btnFooterShare');

  const STORE_ADDRESS = "부산광역시 남구 문현동 이마트 센트럴점 지하 1층 신선식품 코너";

  if (btnNaverMap) {
    btnNaverMap.addEventListener('click', () => {
      window.open('https://map.naver.com/p/search/' + encodeURIComponent('이마트 센트럴점'), '_blank');
    });
  }

  if (btnKakaoMap) {
    btnKakaoMap.addEventListener('click', () => {
      window.open('https://map.kakao.com/link/search/' + encodeURIComponent('이마트 센트럴점'), '_blank');
    });
  }

  if (btnCopyAddress) {
    btnCopyAddress.addEventListener('click', () => {
      navigator.clipboard.writeText(STORE_ADDRESS).then(() => {
        showToast('📍 매장 주소가 클립보드에 복사되었습니다!', '📋');
      }).catch(() => {
        showToast(STORE_ADDRESS, '📍');
      });
    });
  }

  function handleShare() {
    const shareData = {
      title: '[이마트 센트럴점] 간편식 2개 사면 20% 할인!',
      text: '매일 낮 12:00 선착순 20세트 타임어택! 덮밥/샐러드랩 전 조합 9천원대 (1끼 4,000원대)',
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('🔗 프로모션 링크가 클립보드에 복사되었습니다!', '✨');
      }).catch(() => {
        showToast('링크 공유를 지원하지 않는 브라우저입니다.', '⚠️');
      });
    }
  }

  if (btnShareKakao) btnShareKakao.addEventListener('click', handleShare);
  if (btnFooterShare) btnFooterShare.addEventListener('click', handleShare);


  // =========================================================================
  // 9. TOAST NOTIFICATION UTILITY
  // =========================================================================
  function showToast(message, icon = '💡') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // Keyboard Accessibility: Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      closeAlarmModal();
    }
  });

});
