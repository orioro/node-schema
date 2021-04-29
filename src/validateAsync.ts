import { get } from 'lodash'
import { collectValidations } from './collectValidations'
import { prepareValidate, ValidationError } from '@orioro/validate'

import {
  ResolvedSchema,
  ValidationErrorSpec,
  ValidateContext,
  ValidateAsyncOptions,
  CollectValidationsPathOptions,
} from './types'

const _runValidationsAsyncSerial = (validateFn, validations, value) =>
  validations
    .reduce(
      (allErrorsPromise, { path, validationExpression }) =>
        allErrorsPromise.then((allErrors) => {
          const pathValue = path === '' ? value : get(value, path)

          return validateFn(validationExpression, pathValue).then(
            (pathErrors) =>
              pathErrors === null
                ? allErrors
                : [
                    ...allErrors,
                    ...pathErrors.map((errorSpec) => ({
                      path,
                      ...errorSpec,
                      value: pathValue,
                    })),
                  ]
          )
        }),
      Promise.resolve([])
    )
    .then((result) => (result.length === 0 ? null : result))

const _runValidationsAsyncParallel = (validateFn, validations, value) =>
  Promise.all<ValidationErrorSpec[]>(
    validations.map(({ path, validationExpression }) => {
      const pathValue = path === '' ? value : get(value, path)

      return validateFn(validationExpression, pathValue).then((pathErrors) =>
        pathErrors === null
          ? []
          : pathErrors.map((errorSpec) => ({
              path,
              ...errorSpec,
              value: pathValue,
            }))
      )
    })
  ).then(([first, ...rest]) => {
    const result = first.concat(...rest)

    return result.length === 0 ? null : result
  })

const DEFAULT_ASYNC_MODE = 'serial'

const _parseOptions = (
  options?: ValidateAsyncOptions | string[]
): {
  mode: string
  pathOptions: CollectValidationsPathOptions | undefined
} => {
  if (!options) {
    return {
      mode: DEFAULT_ASYNC_MODE,
      pathOptions: undefined,
    }
  } else if (Array.isArray(options)) {
    return {
      mode: DEFAULT_ASYNC_MODE,
      pathOptions: { include: options },
    }
  } else {
    const { mode, ...pathOptions } = options

    return {
      mode,
      pathOptions,
    }
  }
}

/**
 * @function validateAsync
 */
export const validateAsync = (
  { collectors, resolveSchema, interpreters }: ValidateContext,
  resolvedSchema: ResolvedSchema,
  value: any, // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
  options?: ValidateAsyncOptions | string[]
): Promise<null | ValidationErrorSpec[]> => {
  const { mode, pathOptions } = _parseOptions(options)
  const { validateAsync: _validateAsync } = prepareValidate({ interpreters })

  const validations = collectValidations(
    {
      pathOptions,
      collectors,
      resolveSchema,
    },
    resolvedSchema,
    value
  )

  return mode === 'parallel'
    ? _runValidationsAsyncParallel(_validateAsync, validations, value)
    : _runValidationsAsyncSerial(_validateAsync, validations, value)
}

export const validateAsyncThrow = (
  context: ValidateContext,
  resolvedSchema: ResolvedSchema,
  value: any, // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
  options?: ValidateAsyncOptions
): Promise<void> =>
  validateAsync(context, resolvedSchema, value, options).then((errors) => {
    if (errors !== null) {
      throw new ValidationError(errors, value)
    }
  })
