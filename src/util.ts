import { ValidationErrorSpec } from '@orioro/validate'
import { ResolvedSchema } from './types'

export const getError = (
  schema:ResolvedSchema,
  key:string,
  defaultError:ValidationErrorSpec
):ValidationErrorSpec => (
  (schema.errors && schema.errors[key]) || defaultError
)

export const fnPipe = (firstFn, ...remainingFns) => (...args) => (
  remainingFns.reduce((res, fn) => fn(res), firstFn(...args))
)
