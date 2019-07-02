import omit from 'lodash.omit'
import isPlainObject from 'lodash.isplainobject'
import { executeMatchingReduce, testCriteria } from '@orioro/cascade'
import pick from 'lodash.pick'
import {
  mergeArrays,
  schemaIsType,
  mergeTypeLists,
  applyTransforms,
} from './util'

const PARSER_SCHEMA_TRANSFORMS = {
  criteria: {
    transforms: {
      $exists: true,
      $type: 'array',
    }
  },
  value: ({ transforms, ...schema}, value, options) => {
    const schemaTransforms = transforms.reduce((acc, transform) => {
      return isPlainObject(transform.schema) &&
             (transform.condition === undefined ||
              testCriteria(transform.condition, value)) ?
        [...acc, transform.schema] : acc
    }, [])

    return applyTransforms(schemaTransforms, schema, value)
  }
}

const PARSER_MAP = {
  criteria: (schema, value, { MAP_TYPES }) => {
    return schemaIsType(schema, MAP_TYPES) && schema.attributes
  },

  value: (schema, value, options) => {
    return {
      ...schema,
      attributes: Object.keys(schema.attributes).reduce((acc, attributeId) => {
        const attributeSchema = schema.attributes[attributeId]
        return {
          ...acc,
          [attributeId]: _schemaParse(
            options,
            {
              ...attributeSchema,
              label: attributeSchema.label || attributeId,
            },
            typeof value === 'object' ? value[attributeId] : value
          )
        }
      }, {})
    }
  }
}

const CORE_PARSERS = [
  PARSER_SCHEMA_TRANSFORMS,

  PARSER_MAP,
]

const _schemaParse = (options, schema, value) => {
  return executeMatchingReduce(
    CORE_PARSERS,
    schema,
    value,
    options
  )
}

export const schemaParse = (options, schema, value) => {
  const typeLists = mergeTypeLists(options)

  if (!schemaIsType(schema, typeLists.ALL_TYPES)) {
    throw new Error(`Invalid schema.type \`${schema.type}\``)
  }

  return _schemaParse({
    ...options,
    ...typeLists,
  }, schema, value)
}
