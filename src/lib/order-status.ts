export const ORDER_STATUS_OPTIONS = [
  { value: 'paid', label: '결제 완료' },
  { value: 'pending', label: '배송준비중' },
  { value: 'shipped', label: '배송중' },
  { value: 'delivered', label: '배송완료' },
] as const;

const ORDER_STATUS_VALUES = ORDER_STATUS_OPTIONS.map((option) => option.value);

export type OrderStatusValue = (typeof ORDER_STATUS_OPTIONS)[number]['value'];

export function isOrderStatusValue(value: string): value is OrderStatusValue {
  return ORDER_STATUS_VALUES.includes(value as OrderStatusValue);
}
