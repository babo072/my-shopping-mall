'use client';

import { deleteProduct } from "@/app/admin/actions";

type DeleteButtonProps = {
  productId: string;
}

export default function DeleteButton({ productId }: DeleteButtonProps) {
  const handleDelete = async () => {
    // 사용자에게 삭제 여부를 확인받습니다.
    if (window.confirm('정말로 이 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      const result = await deleteProduct(productId);
      if (result.error) {
        alert(result.error);
      } else {
        alert('상품이 성공적으로 삭제되었습니다.');
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="text-sm text-red-500 hover:text-red-400 transition-colors"
    >
      삭제
    </button>
  );
}