import { get } from 'lodash'
import { parseValidations } from './parseValidations'
import { validate as _validate } from '@orioro/validate'
import { ALL_EXPRESSIONS, $$VALUE, evaluate } from '@orioro/expression'
import {
  schemaTypeExpression,
  GetTypeInterface
} from './expressions'

import {
  ResolvedSchema,
  Context
} from './types'

type ValidateContext = Context & {
  getType?: GetTypeInterface
}

export const validate = (
  resolvedSchema:ResolvedSchema,
  context:ValidateContext
) => {
  const validations = parseValidations(resolvedSchema, context)

  const interpreters = {
    ...ALL_EXPRESSIONS,
    $schemaType: schemaTypeExpression(context.getType),
  }

  const result = validations.reduce((errors, { path, validation }) => {

    const pathValue = path === ''
      ? context.value
      : get(context.value, path)

    const result = _validate(
      validation,
      pathValue,
      { interpreters }
    )

    return result === null
      ? errors
      : [...errors, ...result.map(result => ({
          ...result,
          path,
          value: pathValue
        }))]

  }, [])

  return result.length === 0
    ? null
    : result
}
