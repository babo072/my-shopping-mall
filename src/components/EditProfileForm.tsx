'use client';

import { useState, useEffect } from 'react';
import { updateProfile } from '@/app/actions/profile';
import type { Tables } from '@/types/supabase';

// window 객체에 daum 객체가 있을 수 있음을 TypeScript에 알려줍니다.
declare global {
  interface Window {
    daum: any;
  }
}

type Profile = Tables<'profiles'>;

export default function EditProfileForm({ profile }: { profile: Profile | null }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isDaumLoaded, setIsDaumLoaded] = useState(false);

  // Daum Postcode 스크립트 로딩 확인
  useEffect(() => {
    // 이미 로드되어 있는지 확인
    if (window.daum && window.daum.Postcode) {
      setIsDaumLoaded(true);
      return;
    }

    // 스크립트가 이미 DOM에 있는지 확인
    const existingScript = document.querySelector('script[src*="postcode.v2.js"]');
    if (existingScript) {
      // 스크립트는 있지만 아직 로드되지 않은 경우, 로드 완료를 기다림
      const checkDaum = setInterval(() => {
        if (window.daum && window.daum.Postcode) {
          setIsDaumLoaded(true);
          clearInterval(checkDaum);
        }
      }, 100);
      
      // 10초 후에도 로드되지 않으면 포기
      setTimeout(() => clearInterval(checkDaum), 10000);
      return;
    }

    // 스크립트 동적 로딩
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.onload = () => {
      setIsDaumLoaded(true);
    };
    script.onerror = () => {
      console.error('Daum Postcode 스크립트 로딩 실패');
    };
    document.head.appendChild(script);

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // 주소 검색 버튼 클릭 시 실행될 함수
  const handleAddressSearch = () => {
    if (!isDaumLoaded || !window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      new window.daum.Postcode({
        oncomplete: function (data: any) {
          // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분.
          const postcodeInput = document.getElementById('postcode') as HTMLInputElement;
          const addressInput = document.getElementById('address') as HTMLInputElement;
          const detailAddressInput = document.getElementById('detailAddress') as HTMLInputElement;
          
          if (postcodeInput) postcodeInput.value = data.zonecode;
          if (addressInput) addressInput.value = data.address;
          if (detailAddressInput) detailAddressInput.focus();
        },
      }).open();
    } catch (error) {
      console.error('주소 검색 오류:', error);
      alert('주소 검색 중 오류가 발생했습니다.');
    }
  };

  // 폼 제출 시 서버 액션 호출
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const result = await updateProfile(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: result.message || '성공적으로 저장되었습니다.' });
    }
    setIsSubmitting(false);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-400">이메일</label>
        <input type="email" id="email" value={profile?.email || ''} readOnly disabled className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded-md cursor-not-allowed"/>
      </div>
      <div>
        <label htmlFor="userName" className="block text-sm font-medium text-slate-400">받는 분 성함</label>
        <input type="text" name="userName" id="userName" defaultValue={profile?.user_name || ''} required className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded-md"/>
      </div>
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-400">연락처</label>
        <input type="tel" name="phoneNumber" id="phoneNumber" defaultValue={profile?.phone_number || ''} required className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded-md"/>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-400">주소</label>
        <div className="flex gap-2">
          <input type="text" name="postcode" id="postcode" placeholder="우편번호" readOnly defaultValue={profile?.postcode || ''} className="w-1/3 p-2 bg-slate-700 border border-slate-600 rounded-md"/>
          <button 
            type="button" 
            onClick={handleAddressSearch}
            disabled={!isDaumLoaded}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              isDaumLoaded 
                ? 'bg-slate-600 hover:bg-slate-500' 
                : 'bg-slate-700 cursor-not-allowed opacity-50'
            }`}
          >
            {isDaumLoaded ? '주소 검색' : '로딩 중...'}
          </button>
        </div>
        <input type="text" name="address" id="address" placeholder="기본 주소" readOnly defaultValue={profile?.address || ''} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md"/>
        <input type="text" name="detailAddress" id="detailAddress" placeholder="상세 주소" defaultValue={profile?.detail_address || ''} required className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md"/>
      </div>
      
      <button type="submit" disabled={isSubmitting} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md disabled:opacity-50 transition-colors">
        {isSubmitting ? '저장 중...' : '변경사항 저장'}
      </button>

      {message && (
        <p className={`mt-4 text-center text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}