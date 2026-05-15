/**
 * 보안 유틸리티 함수
 * 민감한 데이터 처리 및 XSS 방지
 */

/**
 * XSS 방지: HTML 특수 문자를 이스케이프 처리
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} - 이스케이프된 텍스트
 */
export const escapeHTML = (text) => {
  if (typeof text !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * 사용자 입력값 유효성 검사
 * @param {string} input - 검증할 입력값
 * @param {number} maxLength - 최대 길이
 * @returns {boolean} - 유효 여부
 */
export const validateUserInput = (input, maxLength = 100) => {
  if (typeof input !== 'string') return false;
  if (input.length === 0 || input.length > maxLength) return false;
  
  // XSS 패턴 감지
  const xssPattern = /<script|<iframe|<object|javascript:|on\w+\s*=/gi;
  if (xssPattern.test(input)) return false;
  
  return true;
};

/**
 * 로컬 스토리지에 데이터 저장 (민감정보는 저장하지 않기)
 * @param {string} key - 키
 * @param {any} value - 값
 */
export const safeLocalStorage = (key, value) => {
  try {
    const sanitizedKey = escapeHTML(key);
    localStorage.setItem(sanitizedKey, JSON.stringify(value));
  } catch (error) {
    console.error('LocalStorage 저장 실패:', error);
  }
};

/**
 * 로컬 스토리지에서 데이터 읽기
 * @param {string} key - 키
 * @returns {any} - 저장된 값 또는 null
 */
export const safeLocalStorageGet = (key) => {
  try {
    const sanitizedKey = escapeHTML(key);
    const item = localStorage.getItem(sanitizedKey);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('LocalStorage 읽기 실패:', error);
    return null;
  }
};

export default {
  escapeHTML,
  validateUserInput,
  safeLocalStorage,
  safeLocalStorageGet,
};
