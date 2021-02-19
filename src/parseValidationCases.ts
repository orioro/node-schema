import { get, isPlainObject } from 'lodash'
import { Alternative, cascadeFilter, test } from '@orioro/cascade'
import { getError } from './util'

export const ENUM:Alternative = [
  schema => Array.isArray(schema.enum),
  schema => ([
    ['$in', schema.enum],
    getError(schema, 'enum', {
      code: 'ENUM_ERROR',
      message: `Must be one of ${schema.enum.join(', ')}`
    })
  ])
]

export const STRING_MIN_LENGTH:Alternative = [
  schema => typeof schema.minLength === 'number',
  schema => ([
    ['$gte', schema.minLength, ['$stringLength']],
    getError(schema, 'minLength', {
      code: 'STRING_MIN_LENGTH_ERROR'
    })
  ])
]

export const STRING_MAX_LENGTH:Alternative = [
  schema => typeof schema.maxLength === 'number',
  schema => ([
    ['$lte', schema.maxLength, ['$stringLength']],
    getError(schema, 'maxLength', {
      code: 'STRING_MAX_LENGTH_ERROR'
    })
  ])
]

export const STRING_PATTERN:Alternative = [
  schema => (
    typeof schema.pattern === 'string' ||
    Array.isArray(schema.pattern)
  ),
  schema => ([
    ['$stringTest', schema.pattern],
    getError(schema, 'pattern', {
      code: 'STRING_PATTERN_ERROR'
    })
  ])
]

export const NUMBER_MIN = [
  schema => typeof schema.min === 'number',
  schema => ([
    ['$gte', schema.min],
    getError(schema, 'min', {
      code: 'NUMBER_MIN_ERROR'
    })
  ])
]

export const NUMBER_MIN_EXCLUSIVE = [
  schema => typeof schema.minExclusive === 'number',
  schema => ([
    ['$gt', schema.minExclusive],
    getError(schema, 'minExclusive', {
      code: 'NUMBER_MIN_EXCLUSIVE_ERROR'
    })
  ])
]

export const NUMBER_MAX = [
  schema => typeof schema.max === 'number',
  schema => ([
    ['$lte', schema.max],
    getError(schema, 'max', {
      code: 'NUMBER_MAX_ERROR'
    })
  ])
]

export const NUMBER_MAX_EXCLUSIVE = [
  schema => typeof schema.maxExclusive === 'number',
  schema => ([
    ['$lt', schema.maxExclusive],
    getError(schema, 'maxExclusive', {
      code: 'NUMBER_MAX_EXCLUSIVE_ERROR'
    })
  ])
]

export const NUMBER_MULTIPLE_OF = [
  schema => typeof schema.multipleOf === 'number',
  schema => ([
    ['$eq', 0, ['$mathMod', schema.multipleOf]],
    getError(schema, 'multipleOf', {
      code: 'NUMBER_MULTIPLE_OF_ERROR'
    })    
  ])
]

export const LIST_MIN_LENGTH:Alternative = [
  schema => typeof schema.minLength === 'number',
  schema => ([
    ['$gte', schema.minLength, ['$arrayLength']],
    getError(schema, 'minLength', {
      code: 'LIST_MIN_LENGTH_ERROR'
    })
  ])
]

export const LIST_MAX_LENGTH:Alternative = [
  schema => typeof schema.maxLength === 'number',
  schema => ([
    ['$lte', schema.maxLength, ['$arrayLength']],
    getError(schema, 'maxLength', {
      code: 'LIST_MAX_LENGTH_ERROR'
    })
  ])
]

export const LIST_UNIQUE_ITEMS:Alternative = [
  schema => Boolean(schema.uniqueItems),
  schema => ([
    [
      '$arrayEvery',
      [
        '$eq',
        ['$value', '$$INDEX'],
        [
          '$arrayIndexOf',
          ['$value', '$$VALUE'],
          ['$value', '$$ARRAY']
        ]
      ]
    ],
    getError(schema, 'uniqueItems', {
      code: 'LIST_UNIQUE_ITEMS_ERROR'
    })
  ])
]

export const parseValidationCases = (schema, resolvers) => {
  const parsedCases = cascadeFilter(
    test,
    resolvers,
    schema
  )
  .map(prepareCase => prepareCase(schema))

  const schemaCases = Array.isArray(schema.validation)
    ? schema.validation
    : []

  return [
    ...parsedCases,
    ...schemaCases
  ]
}
