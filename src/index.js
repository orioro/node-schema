import { ValidationError } from '@orioro/validate'
import { schemaParse } from './schema-parse'
import { schemaParseValue } from './schema-parse-value'
import { schemaValidateValue } from './schema-validate-value'

export const schemaParseAndValidateValue = (options, schema, value) => {
  return schemaValidateValue(
    options,
    schema,
    schemaParseValue(options, schema, value)
  )
}

const _wrap = (options, fn) => {
  return (schema, value, endOptions = {}) => {
    return fn({
      ...options,
      ...endOptions
    }, schema, value)
  }
}

export const dataSchema = (options = {}) => {
  return {
    parse: _wrap(options, schemaParse),
    parseValue: _wrap(options, schemaParseValue),
    validateValue: _wrap(options, schemaValidateValue),
    parseAndValidateValue: _wrap(options, schemaParseAndValidateValue),
  }
}

export * from './schema-validate-value'
export * from './schema-parse-value'
export * from './schema-parse'
export {
  ValidationError
}
