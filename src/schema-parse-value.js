import { executeMatchingReduce, testCriteria } from '@orioro/cascade'
import isPlainObject from 'lodash.isplainobject'
import pick from 'lodash.pick'
import {
  mergeArrays,
  schemaIsType,
  mergeTypeLists,
  applyTransforms
} from './util'
import { DATE_DEFAULT_NOW } from './constants'
import { schemaParse } from './schema-parse'

const _cascadeDefaults = (...possibleValues) => {
  return possibleValues.find(v => v !== undefined)
}

const PARSER_MAP_TYPES = {
  criteria: (value, schema, { MAP_TYPES }) => {
    return schemaIsType(schema, MAP_TYPES) && typeof schema.attributes === 'object'
  },
  value: (value, schema, options) => {
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
  criteria: (value, schema, { LIST_TYPES }) => {
    return schemaIsType(schema, LIST_TYPES) && typeof schema.item === 'object'
  },
  value: (value, schema, options) => {
    value = _cascadeDefaults(value, schema.default, [])

    return options.recursive ?
      value.map(itemValue => _schemaParseValue(options, schema.item, itemValue)) :
      value
  }
}

const PARSER_STRING_TYPES = {
  criteria: (value, schema, { STRING_TYPES }) => {
    return schemaIsType(schema, STRING_TYPES)
  },
  value: (value, schema, options) => {
    return _cascadeDefaults(value, schema.default, '')
  }
}

const PARSER_DATE_TYPES = {
  criteria: (value, schema, { DATE_TYPES }) => {
    return schemaIsType(schema, DATE_TYPES)
  },
  value: (value, schema, options) => {
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
  value: (value, schema, options) => {
    return value === undefined ? schema.default : value
  }
}

const PARSER_VALUE_TRANSFORMS = {
  criteria: (value, schema, options) => {
    return Array.isArray(schema.transforms) &&
           PARSER_MAP_TYPES.criteria(value, schema, options)
  },
  value: (value, { transforms }, { MAP_TYPES }) => {

    const valueTransforms = transforms.reduce((acc, transform) => {
      return isPlainObject(transform.value) &&
             (transform.condition === undefined ||
              testCriteria(transform.condition, value)) ?
        [...acc, transform.value] : acc
    }, [])

    return applyTransforms(valueTransforms, value, value)
  }
}

const CORE_SCHEMA_VALUE_PARSERS = [
  PARSER_MAP_TYPES,
  PARSER_LIST_TYPES,
  PARSER_DATE_TYPES,
  PARSER_STRING_TYPES,
  PARSER_DEFAULT,
  PARSER_VALUE_TRANSFORMS,
]

const _schemaParseValue = (options, schema, value) => {
  return executeMatchingReduce(
    options.valueParsers,
    value,
    schema,
    options
  )
}

export const schemaParseValue = ({ valueParsers, ...options }, schema, value) => {
  return _schemaParseValue(
    {
      ...options,
      ...mergeTypeLists(options),
      valueParsers: mergeArrays(valueParsers, CORE_SCHEMA_VALUE_PARSERS),
    },
    schemaParse(options, schema, value),
    value
  )
}
