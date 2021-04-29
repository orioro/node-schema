import { get } from 'lodash'
import { collectValidations } from './collectValidations'
import { prepareValidate, ValidationError } from '@orioro/validate'

import {
  ResolvedSchema,
  ValidationErrorSpec,
  ValidateContext,
  CollectValidationsPathOptions,
} from './types'

/**
 * @function validateSync
 */
export const validateSync = (
  { collectors, resolveSchema, interpreters }: ValidateContext,
  resolvedSchema: ResolvedSchema,
  value: any, // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
  pathOptions?: CollectValidationsPathOptions | string[]
): null | ValidationErrorSpec[] => {
  const { validateSync: _validateSync } = prepareValidate({ interpreters })

  const validations = collectValidations(
    {
      pathOptions: Array.isArray(pathOptions)
        ? { include: pathOptions }
        : pathOptions,
      collectors,
      resolveSchema,
    },
    resolvedSchema,
    value
  )

  const result = validations.reduce(
    (allErrors, { path, validationExpression }) => {
      const pathValue = path === '' ? value : get(value, path)

      const pathErrors = _validateSync(validationExpression, pathValue)

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
  value: any, // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
  pathOptions?: CollectValidationsPathOptions | string[]
): void => {
  const errors = validateSync(context, resolvedSchema, value, pathOptions)

  if (errors !== null) {
    throw new ValidationError(errors, value)
  }
}
