import { z } from 'zod'
import type { MarketSearchSchemaInput } from '@/types/schemas'

export const marketSearchValidationSchema = z
  .object({
    startDate: z.string().min(1, '시작일을 선택해 주세요.'),
    endDate: z.string().min(1, '종료일을 선택해 주세요.'),
    itemCode: z.string().nullable(),
    grade: z.string().nullable(),
    unitName: z.string().nullable(),
  })
  .refine((value) => Number(value.startDate) >= 20230101, {
    message: '데이터는 2023년부터 수집중입니다.',
    path: ['startDate'],
  })
  .refine((value) => Number(value.endDate) >= Number(value.startDate), {
    message: '종료일은 시작일보다 크거나 같아야 합니다.',
    path: ['endDate'],
  })

export function validateMarketSearchFilters(filters: MarketSearchSchemaInput) {
  return marketSearchValidationSchema.safeParse(filters)
}
