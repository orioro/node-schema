import { get } from 'lodash'
import {
  collectValidations,
  ParseValidationsContext,
} from './collectValidations'
import { prepareValidate, ValidationError } from '@orioro/validate'
import { InterpreterList } from '@orioro/expression'

import { ResolvedSchema, ValidationErrorSpec } from './types'

type ValidateContext = ParseValidationsContext & {
  interpreters: InterpreterList
}

/**
 * @todo * Rewrite tests using @orioro/jest-util
 * @todo validateSync Support async validations
 * @function validateSync
 */
export const validateSync = (
  { collectors, resolveSchema, interpreters }: ValidateContext,
  resolvedSchema: ResolvedSchema,
  value: any // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
): null | ValidationErrorSpec[] => {
  const { validateSync: _validateSync } = prepareValidate({ interpreters })

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

      const pathErrors = _validateSync(validationExpression, pathValue, {
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

/**
 * Performs same validation process as `validateSync` but if an error
 * is encountered throws a `ValidationError`.
 *
 * @function validateSyncThrow
 */
export const validateSyncThrow = (
  context: ValidateContext,
  resolvedSchema: ResolvedSchema,
  value: any // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
): void => {
  const errors = validateSync(context, resolvedSchema, value)

  if (errors !== null) {
    throw new ValidationError(errors, value)
  }
}

export {
  /**
   * @constructor ValidationError
   */
  ValidationError,
}
