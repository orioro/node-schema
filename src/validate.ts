import { get } from 'lodash'
import { parseValidations } from './parseValidations'
import { validate as _validate } from '@orioro/validate'
import { ALL_EXPRESSIONS, $$VALUE, evaluate } from '@orioro/expression'

export const validate = (options, resolvedSchema, value) => {
  const validations = parseValidations(resolvedSchema)

  const interpreters = {
    ...ALL_EXPRESSIONS,
    $schemaType: (context, value = $$VALUE) => {
      return options.getType(evaluate(context, value))
    },
    $schemaValidate: (context, _resolvedSchema, value = $$VALUE) => {
      return validate(options, _resolvedSchema, evaluate(context, value))
    }
  }

  return validations.reduce((errors, { path, validation }) => {

    return [
      ...errors,
      ..._validate(validation, get(value, path), {
        interpreters
      })
    ]

  }, [])
}
