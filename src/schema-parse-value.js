import { executeMatching } from '@orioro/cascade'
import pick from 'lodash.pick'
import {
  mergeArrays,
  schemaIsType,
  mergeTypeLists
} from './util'
import { DATE_DEFAULT_NOW } from './constants'

const _cascadeDefaults = (...possibleValues) => {
  return possibleValues.find(v => v !== undefined)
}

const PARSER_MAP_TYPES = {
  criteria: (schema, { MAP_TYPES }) => {
    return schemaIsType(schema, MAP_TYPES) && typeof schema.attributes === 'object'
  },
  value: (schema, options, value) => {
    const knownAttributeIds = Object.keys(schema.attributes)

    value = pick(_cascadeDefaults(value, schema.default, {}), knownAttributeIds)

    return options.recursive ?
      knownAttributeIds.reduce((acc, attributeId) => {
        return {
          ...acc,
          [attributeId]: _schemaParseValue(
            options,
            schema.attributes[attributeId],
            value[attributeId]
          )
        }
      }, value) :
      value
  }
}

const PARSER_LIST_TYPES = {
  criteria: (schema, { LIST_TYPES }) => {
    return schemaIsType(schema, LIST_TYPES) && typeof schema.item === 'object'
  },
  value: (schema, options, value) => {
    value = _cascadeDefaults(value, schema.default, [])

    return options.recursive ?
      value.map(itemValue => _schemaParseValue(options, schema.item, itemValue)) :
      value
  }
}

const PARSER_STRING_TYPES = {
  criteria: (schema, { STRING_TYPES }) => {
    return schemaIsType(schema, STRING_TYPES)
  },
  value: (schema, options, value) => {
    return _cascadeDefaults(value, schema.default, '')
  }
}

const PARSER_DATE_TYPES = {
  criteria: (schema, { DATE_TYPES }) => {
    return schemaIsType(schema, DATE_TYPES)
  },
  value: (schema, options, value) => {
    value = _cascadeDefaults(value, schema.default, undefined)

    switch (value) {
      case DATE_DEFAULT_NOW:
        return (new Date()).toISOString()
      default:
        return value
    }
  }
}

const PARSER_DEFAULT = {
  criteria: true,
  value: (schema, options, value) => {
    return value === undefined ? schema.default : value
  }
}

const CORE_SCHEMA_VALUE_PARSERS = [
  PARSER_MAP_TYPES,
  PARSER_LIST_TYPES,
  PARSER_DATE_TYPES,
  PARSER_STRING_TYPES,
  PARSER_DEFAULT,
]

const _schemaParseValue = (options, schema, value) => {
  return executeMatching(
    options.valueParsers,
    schema,
    options,
    value
  )
}

export const schemaParseValue = ({ valueParsers, ...options }, schema, value) => {
  return _schemaParseValue({
    ...options,
    ...mergeTypeLists(options),
    valueParsers: mergeArrays(valueParsers, CORE_SCHEMA_VALUE_PARSERS),
  }, schema, value)
}
