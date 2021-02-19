import { ValidationErrorSpec } from '@orioro/validate'
import { ResolvedSchema } from './types'

export const getError = (
  schema: ResolvedSchema,
  key: string,
  defaultError: ValidationErrorSpec
): ValidationErrorSpec => (schema.errors && schema.errors[key]) || defaultError

type Fn = (...args: any[]) => any

export const fnPipe = (firstFn: Fn, ...remainingFns: Fn[]): Fn => (
  ...args: any[]
) => remainingFns.reduce((res, fn) => fn(res), firstFn(...args))
