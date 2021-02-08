import { get, isPlainObject } from 'lodash'
import { parallelCases } from '@orioro/validate'
import { Alternative, cascadeFilter, test } from '@orioro/cascade'

const _error = (schema, id, defaultError) => (
  get(schema, `errors.${id}`) || defaultError
)

export const TYPE:Alternative = [
  schema => typeof schema.type === 'string',
  schema => ([
    ['$eq', schema.type, ['$schemaType']],
    _error(schema, 'type', {
      code: 'TYPE_ERROR',
      message: `Must be type ${schema.type}`
    })
  ])
]

export const ENUM:Alternative = [
  schema => Array.isArray(schema.enum),
  schema => ([
    ['$in', schema.enum],
    _error(schema, 'enum', {
      code: 'ENUM_ERROR',
      message: `Must be one of ${schema.enum.join(', ')}`
    })
  ])
]

export const STRING_MIN_LENGTH:Alternative = [
  (schema) => typeof schema.minLength === 'number',
  (schema) => ([
    ['$gte', schema.minLength, ['$stringLength']],
    _error(schema, 'stringMinLength', {
      code: 'STRING_MIN_LENGTH'
    })
  ])
]

export const STRING_MAX_LENGTH:Alternative = [
  (schema) => typeof schema.maxLength === 'number',
  schema => ([
    ['$lte', schema.maxLength, ['$stringLength']],
    _error(schema, 'stringMaxLength', {
      code: 'STRING_MAX_LENGTH'
    })
  ])
]

export const NUMBER_MIN = [
  schema => typeof schema.min === 'number',
  schema => ([
    ['$gte', schema.min],
    _error(schema, 'numberMin', {
      code: 'NUMBER_MIN'
    })
  ])
]

export const NUMBER_MIN_EXCLUSIVE = [
  schema => typeof schema.minExclusive === 'number',
  schema => ([
    ['$gt', schema.minExclusive],
    _error(schema, 'numberMinExclusive', {
      code: 'NUMBER_MIN_EXCLUSIVE'
    })
  ])
]

export const NUMBER_MAX = [
  schema => typeof schema.max === 'number',
  schema => ([
    ['$lte', schema.max],
    _error(schema, 'numberMin', {
      code: 'NUMBER_MAX'
    })
  ])
]

export const NUMBER_MAX_EXCLUSIVE = [
  schema => typeof schema.maxExclusive === 'number',
  schema => ([
    ['$lt', schema.maxExclusive],
    _error(schema, 'numberMaxExclusive', {
      code: 'NUMBER_MAX_EXCLUSIVE'
    })
  ])
]

// export const LIST_ITEM = [
//   schema => isPlainObject(schema.item),
//   schema => ([
//     ['$schemaValidate', schema.item]
//   ])
// ]

export const parseValidationCases = (caseResolvers, schema) => {
  const parsedCases = cascadeFilter(
    test,
    caseResolvers,
    schema
  )
  .map(prepareCase => prepareCase(schema, context))

  const schemaCases = Array.isArray(schema.validation)
    ? schema.validation
    : []

  return parallelCases([
    ...parsedCases,
    ...schemaCases
  ])
}
