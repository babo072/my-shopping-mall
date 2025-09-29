'use client';

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { addProduct } from "@/app/admin/actions";

type FilePreview = {
  id: string;
  file: File;
  url: string;
};

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SHORT_DESCRIPTION = 80;

type FieldErrors = {
  name?: string;
  short_description?: string;
  description?: string;
  price?: string;
};

export default function AddProductForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [nameValue, setNameValue] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [priceValue, setPriceValue] = useState('');
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const supabase = createClient();

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const nextPreviews: FilePreview[] = [];
    let rejectedMessage: string | null = null;

    if (files.length === 0) {
      setPreviews([]);
      return;
    }

    if (files.length > MAX_FILES) {
      rejectedMessage = `이미지는 최대 ${MAX_FILES}개까지 업로드할 수 있습니다.`;
    }

    const limitedFiles = files.slice(0, MAX_FILES);

    for (const file of limitedFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        rejectedMessage = 'JPG, PNG, WEBP 형식의 이미지만 업로드할 수 있습니다.';
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejectedMessage = '이미지 용량은 5MB 이하만 허용됩니다.';
        continue;
      }

      nextPreviews.push({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
      });
    }

    setPreviews(nextPreviews);
    setError(rejectedMessage);
    setFieldErrors((prev) => ({ ...prev, image: undefined }));
  };

  const removePreview = (id: string) => {
    setPreviews((current) => {
      const target = current.find((preview) => preview.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return current.filter((preview) => preview.id !== id);
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setFieldErrors({});

    if (previews.length === 0) {
      setError('하나 이상의 이미지 파일을 선택해주세요.');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const formErrors: FieldErrors = {};

    const name = (formData.get('name') as string)?.trim();
    const shortDesc = (formData.get('short_description') as string)?.trim();
    const description = (formData.get('description') as string)?.trim();
    const priceRaw = formData.get('price') as string;
    const priceNumber = Number(priceRaw);

    if (!name) {
      formErrors.name = '상품명을 입력해주세요.';
    }
    if (!shortDesc) {
      formErrors.short_description = '짧은 설명을 입력해주세요.';
    } else if (shortDesc.length > MAX_SHORT_DESCRIPTION) {
      formErrors.short_description = `짧은 설명은 최대 ${MAX_SHORT_DESCRIPTION}자까지 입력할 수 있습니다.`;
    }
    if (!description) {
      formErrors.description = '상세 설명을 입력해주세요.';
    }
    if (!Number.isFinite(priceNumber) || priceNumber <= 0 || !Number.isInteger(priceNumber)) {
      formErrors.price = '가격은 1 이상 정수로 입력해주세요.';
    }

    if (Object.keys(formErrors).length > 0) {
      setFieldErrors(formErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const uploadPromises = previews.map(({ file }) => {
        const fileExt = file.name.split('.').pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;
        return supabase.storage.from('product-images').upload(filePath, file);
      });

      const uploadResults = await Promise.all(uploadPromises);

      const failedUploads = uploadResults.filter(result => result.error);
      if (failedUploads.length > 0) {
        throw new Error('일부 이미지 업로드에 실패했습니다.');
      }

      const imageUrls = uploadResults.map(result => {
        const filePath = result.data!.path;
        return supabase.storage.from('product-images').getPublicUrl(filePath).data.publicUrl;
      });

      const productData = {
        name,
        description,
        short_description: shortDesc,
        price: priceNumber,
        imageUrls,
      };

      const result = await addProduct(productData);

      if (result.error) {
        throw new Error(result.error);
      } else {
        setSuccessMessage('상품이 성공적으로 추가되었습니다.');
        (event.target as HTMLFormElement).reset();
        previews.forEach((preview) => URL.revokeObjectURL(preview.url));
        setPreviews([]);
        setNameValue('');
        setShortDescription('');
        setDescriptionValue('');
        setPriceValue('');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '상품 추가 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="lg:col-span-1 bg-slate-800 p-6 rounded-lg h-fit">
      <h2 className="text-xl font-bold mb-4">새 상품 추가</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-400">상품명</label>
          <input
            type="text"
            name="name"
            id="name"
            value={nameValue}
            onChange={(event) => {
              setNameValue(event.target.value);
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }}
            aria-invalid={fieldErrors.name ? 'true' : 'false'}
            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
            required
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {fieldErrors.name && (
            <p id="name-error" className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="short_description" className="block text-sm font-medium text-slate-400">
              짧은 설명 (목록용)
            </label>
            <span className="text-xs text-slate-500">
              {shortDescription.length}/{MAX_SHORT_DESCRIPTION}
            </span>
          </div>
          <textarea
            name="short_description"
            id="short_description"
            rows={2}
            value={shortDescription}
            onChange={(event) => {
              setShortDescription(event.target.value);
              if (fieldErrors.short_description) {
                setFieldErrors((prev) => ({ ...prev, short_description: undefined }));
              }
            }}
            aria-invalid={fieldErrors.short_description ? 'true' : 'false'}
            aria-describedby={fieldErrors.short_description ? 'short-description-error' : undefined}
            required
            className={`mt-1 w-full rounded-md border px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              fieldErrors.short_description ? 'border-red-500' : 'border-slate-600 bg-slate-700'
            }`}
          />
          {fieldErrors.short_description && (
            <p id="short-description-error" className="mt-1 text-xs text-red-400">
              {fieldErrors.short_description}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-400">
            상세 설명 (HTML 가능)
          </label>
          <textarea
            name="description"
            id="description"
            rows={5}
            value={descriptionValue}
            onChange={(event) => {
              setDescriptionValue(event.target.value);
              if (fieldErrors.description) {
                setFieldErrors((prev) => ({ ...prev, description: undefined }));
              }
            }}
            aria-invalid={fieldErrors.description ? 'true' : 'false'}
            aria-describedby={fieldErrors.description ? 'description-error' : undefined}
            required
            className={`mt-1 w-full rounded-md border px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              fieldErrors.description ? 'border-red-500' : 'border-slate-600 bg-slate-700'
            }`}
          />
          {fieldErrors.description && (
            <p id="description-error" className="mt-1 text-xs text-red-400">{fieldErrors.description}</p>
          )}
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-slate-400">가격 (₩)</label>
          <input
            type="number"
            name="price"
            id="price"
            min={1}
            step={1}
            inputMode="numeric"
            pattern="[0-9]*"
            value={priceValue}
            onChange={(event) => {
              setPriceValue(event.target.value);
              if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: undefined }));
            }}
            aria-invalid={fieldErrors.price ? 'true' : 'false'}
            aria-describedby={fieldErrors.price ? 'price-error' : undefined}
            required
            className={`mt-1 w-full rounded-md border px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              fieldErrors.price ? 'border-red-500' : 'border-slate-600 bg-slate-700'
            }`}
          />
          {fieldErrors.price && (
            <p id="price-error" className="mt-1 text-xs text-red-400">{fieldErrors.price}</p>
          )}
        </div>
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-slate-400">
            상품 이미지 (최대 {MAX_FILES}장, JPG/PNG/WEBP, 5MB 이하)
          </label>
          <input
            type="file"
            id="image"
            accept={ALLOWED_TYPES.join(',')}
            multiple
            onChange={handleFileSelection}
            className="mt-1 w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
          />
          {previews.length > 0 && (
            <ul className="mt-3 grid grid-cols-3 gap-3">
              {previews.map((preview) => (
                <li key={preview.id} className="relative">
                  <div className="relative h-24 w-full overflow-hidden rounded-md border border-slate-600 bg-slate-700">
                    <Image
                      src={preview.url}
                      alt={`선택한 이미지 ${preview.file.name}`}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePreview(preview.id)}
                    className="mt-1 w-full rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:border-red-500 hover:text-red-400"
                  >
                    제거
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50">
          {isSubmitting ? '처리 중...' : '상품 추가하기'}
        </button>
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        {successMessage && <p className="text-sm text-green-400 mt-2">{successMessage}</p>}
      </form>
    </div>
  );
}
