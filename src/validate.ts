import { get } from 'lodash'
import { parseValidations } from './parseValidations'
import { validate as _validate } from '@orioro/validate'
import { ALL_EXPRESSIONS, $$VALUE, evaluate } from '@orioro/expression'
import { schemaTypeExpression } from './expressions'

import {
  ResolvedSchema,
  Context
} from './types'

type ValidateContext = Context & {
  getType?: (value: any) => (string | void)
}

export const validate = (
  resolvedSchema:ResolvedSchema,
  context:ValidateContext
) => {
  const validations = parseValidations(resolvedSchema, context)

  const interpreters = {
    ...ALL_EXPRESSIONS,
    $schemaType: schemaTypeExpression(context.getType),
    // $schemaValidate: (context, _resolvedSchema, value = $$VALUE) => {
    //   return validate(options, _resolvedSchema, evaluate(context, value))
    // }
  }

  // console.log(JSON.stringify(validations, null, '  '))


  const value = context.value

  const result = validations.reduce((errors, { path, validation }) => {

    const pathValue = path === ''
      ? value
      : get(value, path)

    const result = _validate(
      validation,
      pathValue,
      { interpreters }
    )

    return Array.isArray(result)
      ? [...errors, ...result.map(result => ({
          ...result,
          path,
          value: pathValue
        }))]
      : errors

  }, [])

  return result.length === 0
    ? null
    : result
}
