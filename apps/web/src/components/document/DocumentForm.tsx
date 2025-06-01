import React from "react";

export function DocumentForm() {
  return (
    <form>
      <label>
        문서 제목:
        <input type="text" name="title" />
      </label>
      {/* 기타 폼 필드 */}
      <button type="submit">생성</button>
    </form>
  );
} 