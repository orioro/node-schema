import { get } from 'lodash'
import { parseValidations } from './parseValidations'
import { validate as _validate, ValidationErrorSpec } from '@orioro/validate'
import { ALL_EXPRESSIONS } from '@orioro/expression'
import { schemaTypeExpression, GetTypeInterface } from './expressions'

import { ResolvedSchema, Context } from './types'

type ValidateContext = Context & {
  getType?: GetTypeInterface
}

export const validate = (
  resolvedSchema: ResolvedSchema,
  value: any, // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
  context: ValidateContext = {}
): null | ValidationErrorSpec[] => {
  context = {
    ...context,
    value,
  }

  const validations = parseValidations(resolvedSchema, context.value, context)

  const interpreters = {
    ...ALL_EXPRESSIONS,
    $schemaType: schemaTypeExpression(context.getType),
  }

  const result = validations.reduce((errors, { path, validation }) => {
    const pathValue = path === '' ? context.value : get(context.value, path)

    const result = _validate(validation, pathValue, { interpreters })

    return result === null
      ? errors
      : [
          ...errors,
          ...result.map((result) => ({
            ...result,
            path,
            value: pathValue,
          })),
        ]
  }, [])

  return result.length === 0 ? null : result
}
