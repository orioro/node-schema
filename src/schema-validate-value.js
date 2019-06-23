import {
  validate,
  VALIDATORS,
} from '@orioro/validate'

import { schemaParseValidation } from './schema-parse-validation'

export const schemaValidateValue = ({
  validators = {},
  validateAsync = true,
  ...options
} = {}, schema, value) => {

  validators = {
    ...validators,
    ...VALIDATORS,
  }

  const validation = schemaParseValidation(options, schema)

  return validate({
    ...options,
    async: validateAsync,
    validators
  }, validation, value)
}
