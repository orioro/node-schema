import { isPlainObject } from 'lodash'
import { treeSourceNodes } from '@orioro/tree-source-nodes'
import {
  parallelCases,
  allowValues
} from '@orioro/validate'
import {
  parseValidationCases
} from './parseValidationCases'

// const __isExpression = v => (
//   Array.isArray(v) &&
//   typeof v[0] === 'string' &&
//   v[0].startsWith('$')
// )

// const pipe = (firstFn, ...remainingFns) => (...args) => (
//   remainingFns.reduce((res, fn) => fn(res), firstFn(...args))
// )

// const _validationExp = (validation, context) => {
//   if (__isExpression(validation)) {
//     return validation
//   } else if (Array.isArray(validation)) {
//     return parallelCases(validation)
//   } else if (validation === null || validation === undefined) {
//     return null
//   } else {
//     throw new Error(`Unrecognized validation format: ${validation}`)
//   }
// }

// const _type = (type, validationExp) => {
//   const typeCriteria = ['$eq', type, ['$type']]
//   const typeError = {
//     code: 'TYPE_ERROR',
//     message: `Must be type ${type}`
//   }

//   return ['$if', typeCriteria, validationExp, typeError]
// }

const _required = (required = false, validationExp) => {
  return required
    ? validationExp
    : allowValues([null, undefined], validationExp)
}

export const mapValidationResolver = (mapTypes = ['map']) => ([
  (schema) => (
    isPlainObject(schema) &&
    isPlainObject(schema.properties) &&
    mapTypes.includes(schema.type)
  ),
  (schema, context) => {
    return Object.keys(schema.properties).reduce((acc, key) => {
      return [
        ...acc,
        ...parseValidations(schema.properties[key], {
          ...context,
          path: `${context.path}.${key}`
        })
      ]
    }, [])
  }
])

export const listValidationResolver = (listTypes = ['list']) => ([
  (schema) => (
    isPlainObject(schema) &&
    isPlainObject(schema.properties) &&
    mapTypes.includes(schema.type)
  ),
  (schema, context) => {
    /**
     * For each item in the value, resolve thte item schema
     * and return parsed validations for the specific path
     */
    
    const itemSchema = context.itemSchema

    const itemValidations = context.itemSchema
      ? context.value.reduce((acc, itemValue) => {
          const schema = resolveSchema(itemSchema, {
            interpreters: context.interpreters,
            value: itemValue
          })

          return [...acc, ...parseValidations(schema, {

          })]
        }, [])
      : []

    const validationCases = parseValidationCases([
      LIST_MIN_LENGTH,
      LIST_MAX_LENGTH
    ], schema)

    return [{
      path: context.path,
      validation: _required(schema.required, parallelCases(validationCases))
    }, ...itemValidations]


    // return Object.keys(schema.properties).reduce((acc, key) => {
    //   return [
    //     ...acc,
    //     ...parseValidations(schema.properties[key], {
    //       ...context,
    //       path: `${context.path}.${key}`
    //     })
    //   ]
    // }, [])
  }
])

export const validationResolver = (types, caseResolvers) => ([
  (schema) => (
    isPlainObject(schema) &&
    types.includes(schema.type)
  ),
  (schema, context) => {
    const validationCases = parseValidationCases(caseResolvers, schema)

    return [{
      path: context.path,
      validation: _required(schema.required, parallelCases(validationCases))
    }]
  }
])

export const stringValidationResolver = (stringTypes = ['string']) => validationResolver(
  stringTypes,
  [
    TYPE,
    ENUM,
    STRING_MIN_LENGTH,
    STRING_MAX_LENGTH
  ]
)

export const numberValidationResolver = (numberTypes = ['number']) => validationResolver(
  numberTypes,
  [
    TYPE,
    ENUM,
    NUMBER_MIN,
    NUMBER_MIN_EXCLUSIVE,
    NUMBER_MAX,
    NUMBER_MAX_EXCLUSIVE,
    NUMBER_MULTIPLE_OF,
  ]
)

// export const listValidationResolver = (listTypes = ['list']) => validationResolver(
//   listTypes,
//   [
//     TYPE,
//     LIST_MIN_LENGTH,
//     LIST_MAX_LENGTH,
//     LIST_ITEM
//   ]
// )

export const defaultValidationResolver = () => ([
  (schema, context) => {
    const validationCases = parseValidationCases([
      TYPE,
      ENUM
    ], schema)

    return [{
      path: context.path,
      validation: _required(schema.required, parallelCases(validationCases))
    }]
  }
])

export const parseValidations = (schema, options) => treeSourceNodes(schema, options)
