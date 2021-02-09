import { isPlainObject } from 'lodash'
import {
  NodeResolver,
  treeSourceNodes,
  pathJoin
} from '@orioro/tree-source-nodes'
import {
  parallelCases,
  allowValues,
  prohibitValues
} from '@orioro/validate'
import {
  ENUM,
  STRING_MIN_LENGTH,
  STRING_MAX_LENGTH,
  STRING_PATTERN,

  NUMBER_MIN,
  NUMBER_MIN_EXCLUSIVE,
  NUMBER_MAX,
  NUMBER_MAX_EXCLUSIVE,
  NUMBER_MULTIPLE_OF,

  LIST_MIN_LENGTH,
  LIST_MAX_LENGTH,
  LIST_UNIQUE_ITEMS,

  parseValidationCases
} from './parseValidationCases'

import { resolveSchema } from './resolveSchema'

import {
  Expression
} from '@orioro/expression'

import { getError, fnPipe } from './util'
import { ResolvedSchema, Context } from './types'

export type ParseValidationsContext = Context & {
  resolvers?: NodeResolver[]
}

// const __isExpression = v => (
//   Array.isArray(v) &&
//   typeof v[0] === 'string' &&
//   v[0].startsWith('$')
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

const _type = (
  schema:ResolvedSchema,
  validationExp:Expression
):Expression => {
  const criteria = ['$notEq', schema.type, ['$schemaType']]
  const error = getError(schema, 'type', {
    code: 'TYPE_ERROR',
    message: `Must be type \`${schema.type}\``
  })

  return ['$if', criteria, error, validationExp]
}

const _casesValidationExp = (schema, caseResolvers) => {
  const cases = parseValidationCases(schema, {
    resolvers: caseResolvers
  })

  return cases.length > 0
    ? parallelCases(cases)
    : null
}

const _required = (
  schema:ResolvedSchema,
  validationExp:Expression
):Expression => (
  Boolean(schema.required)
    ? prohibitValues([null, undefined], getError(schema, 'required', {
        code: 'REQUIRED_ERROR',
        message: 'Value is required'
      }), validationExp)
    : allowValues([null, undefined], validationExp)
)

const _wrapValidationExp = (
  schema:ResolvedSchema,
  validationExp:Expression
) => (
  fnPipe(
    _type.bind(null, schema),
    _required.bind(null, schema)
  )(validationExp)
)

export const mapValidationResolver = (mapTypes = ['map']) => ([
  (schema) => (
    isPlainObject(schema) &&
    isPlainObject(schema.properties) &&
    mapTypes.includes(schema.type)
  ),
  (schema, context) => {
    const mapValidation = {
      path: context.path,
      validation: _wrapValidationExp(
        schema,
        _casesValidationExp(schema, [ENUM])
      )
    }

    return Object.keys(schema.properties).reduce((acc, key) => {
      return [
        ...acc,
        ...parseValidations(schema.properties[key], {
          ...context,
          path: pathJoin(context.path, key)
        })
      ]
    }, [mapValidation])
  }
])

export const listValidationResolver = (listTypes = ['list']) => ([
  (schema) => (
    isPlainObject(schema) &&
    listTypes.includes(schema.type)
  ),
  (schema, context) => {
    /**
     * For each item in the value, resolve thte item schema
     * and return parsed validations for the specific path
     */
    
    const itemSchema = schema.itemSchema

    const itemValidations = schema.itemSchema
      ? context.value.reduce((acc, itemValue, index) => {
          const schema = resolveSchema(itemSchema, {
            interpreters: context.interpreters,
            value: itemValue
          })

          return [...acc, ...parseValidations(schema, {
            ...context,
            path: pathJoin(context.path, index)
          })]
        }, [])
      : []

    const cases = parseValidationCases(schema, {
      resolvers: [
        ENUM,
        LIST_MIN_LENGTH,
        LIST_MAX_LENGTH,
        LIST_UNIQUE_ITEMS
      ]
    })

    return [{
      path: context.path,
      validation: _wrapValidationExp(schema, parallelCases(cases))
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
    return [{
      path: context.path,
      validation: _wrapValidationExp(
        schema,
        _casesValidationExp(schema, caseResolvers)
      )
    }]
  }
])

export const stringValidationResolver = (stringTypes = ['string']) => validationResolver(
  stringTypes,
  [
    ENUM,
    STRING_MIN_LENGTH,
    STRING_MAX_LENGTH,
    STRING_PATTERN
  ]
)

export const numberValidationResolver = (numberTypes = ['number']) => validationResolver(
  numberTypes,
  [
    ENUM,
    NUMBER_MIN,
    NUMBER_MIN_EXCLUSIVE,
    NUMBER_MAX,
    NUMBER_MAX_EXCLUSIVE,
    NUMBER_MULTIPLE_OF
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
    return [{
      path: context.path,
      validation: _wrapValidationExp(
        schema,
        _casesValidationExp(schema, [ENUM])
      )
    }]
  }
])


const DEFAULT_RESOLVERS = [
  mapValidationResolver(),
  listValidationResolver(),
  stringValidationResolver(),
  defaultValidationResolver(),
]

export const parseValidations = (
  schema:ResolvedSchema,
  context:ParseValidationsContext
) => treeSourceNodes(schema, {
  resolvers: DEFAULT_RESOLVERS,
  ...context
})
