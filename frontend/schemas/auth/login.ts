import { z } from 'zod'

export const loginSchema = z.object({
  userId: z.string().trim().min(1, '아이디를 입력해 주세요'),
  password: z.string().trim().min(1, '비밀번호를 입력해 주세요'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
