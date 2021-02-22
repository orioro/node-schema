import { get } from 'lodash'
import {
  collectValidations,
  ParseValidationsContext,
} from './collectValidations'
import { validate as _validate } from '@orioro/validate'
import { ExpressionInterpreterList } from '@orioro/expression'

import { ResolvedSchema, ValidationErrorSpec } from './types'

type ValidateContext = ParseValidationsContext & {
  interpreters: ExpressionInterpreterList
}

export const validate = (
  { collectors, resolveSchema, interpreters }: ValidateContext,
  resolvedSchema: ResolvedSchema,
  value: any // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
): null | ValidationErrorSpec[] | void => {
  const validations = collectValidations(
    {
      collectors,
      resolveSchema,
    },
    resolvedSchema,
    value
  )

  const result = validations.reduce(
    (allErrors, { path, validationExpression }) => {
      const pathValue = path === '' ? value : get(value, path)

      const pathErrors = _validate(validationExpression, pathValue, {
        interpreters,
      })

      return pathErrors === null
        ? allErrors
        : [
            ...allErrors,
            ...pathErrors.map((errorSpec) => ({
              path, // allow errorSpec to override `path`
              ...errorSpec,
              value: pathValue,
            })),
          ]
    },
    []
  )

  return result.length === 0 ? null : result
}
