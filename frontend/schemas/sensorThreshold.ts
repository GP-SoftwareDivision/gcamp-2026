import { normalizeThresholdValue, parseThresholdInput } from '@/shared/sensorThreshold'
import type { SensorThresholdSchemaInput } from '@/types/schemas'
import type { SensorThresholdDraft, SensorThresholdValue } from '@/types/stores'
import { z } from 'zod'

export const sensorThresholdValidationSchema = z
  .object({
    minInput: z.string(),
    maxInput: z.string(),
    integerOnly: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const hasMinInput = value.minInput.trim().length > 0
    const hasMaxInput = value.maxInput.trim().length > 0
    const min = hasMinInput ? parseThresholdInput(value.minInput, value.integerOnly) : null
    const max = hasMaxInput ? parseThresholdInput(value.maxInput, value.integerOnly) : null

    if (hasMinInput && min == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minInput'],
        message: '최소값을 숫자로 입력해 주세요.',
      })
    }

    if (hasMaxInput && max == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxInput'],
        message: '최대값을 숫자로 입력해 주세요.',
      })
    }

    if (min != null && max != null && min > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxInput'],
        message: '최소값은 최대값보다 클 수 없습니다.',
      })
    }
  })

export function validateSensorThresholdDraft(
  draft: SensorThresholdDraft,
  options: { integerOnly: boolean; decimals: number },
): { value: SensorThresholdValue | null; errorMessage: string | null } {
  const payload: SensorThresholdSchemaInput = {
    minInput: draft.minInput,
    maxInput: draft.maxInput,
    integerOnly: options.integerOnly,
  }
  const parsed = sensorThresholdValidationSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      value: null,
      errorMessage: parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.',
    }
  }

  const hasMinInput = parsed.data.minInput.trim().length > 0
  const hasMaxInput = parsed.data.maxInput.trim().length > 0
  const min = hasMinInput ? parseThresholdInput(parsed.data.minInput, parsed.data.integerOnly) : null
  const max = hasMaxInput ? parseThresholdInput(parsed.data.maxInput, parsed.data.integerOnly) : null

  if ((hasMinInput && min == null) || (hasMaxInput && max == null)) {
    return {
      value: null,
      errorMessage: '입력값을 확인해 주세요.',
    }
  }

  return {
    value: {
      min:
        min == null
          ? null
          : normalizeThresholdValue(min, {
              integerOnly: parsed.data.integerOnly,
              decimals: options.decimals,
            }),
      max:
        max == null
          ? null
          : normalizeThresholdValue(max, {
              integerOnly: parsed.data.integerOnly,
              decimals: options.decimals,
            }),
    },
    errorMessage: null,
  }
}
