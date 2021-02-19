import { isPlainObject } from 'lodash'
import { Alternative } from '@orioro/cascade'
import {
  NodeResolver,
  treeSourceNodes,
  pathJoin,
} from '@orioro/tree-source-nodes'
import { parallelCases, allowValues, prohibitValues } from '@orioro/validate'
import {
  ENUM,
  STRING_MIN_LENGTH,
  STRING_MAX_LENGTH,
  NUMBER_MIN,
  NUMBER_MAX,
  NUMBER_MULTIPLE_OF,
  ARRAY_MIN_LENGTH,
  ARRAY_MAX_LENGTH,
  ARRAY_UNIQUE_ITEMS,
  parseValidationCases,
} from './parseValidationCases'

import { resolveSchema } from './resolveSchema'

import { Expression } from '@orioro/expression'

import { getError, fnPipe } from './util'
import { ResolvedSchema, Context, ValidationSpec } from './types'

export type ParseValidationsContext = Context & {
  resolvers?: NodeResolver[]
}

const _type = (
  schema: ResolvedSchema,
  validationExp: Expression
): Expression => {
  const criteria = ['$notEq', schema.type, ['$schemaType']]
  const error = getError(schema, 'type', {
    code: 'TYPE_ERROR',
    message: `Must be type \`${schema.type}\``,
  })

  return ['$if', criteria, error, validationExp]
}

const _casesValidationExp = (
  schema: ResolvedSchema,
  caseResolvers
): Expression | null => {
  const cases = parseValidationCases(schema, caseResolvers)

  return cases.length > 0 ? parallelCases(cases) : null
}

const _required = (
  schema: ResolvedSchema,
  validationExp: Expression
): Expression =>
  schema.required
    ? prohibitValues(
        [null, undefined],
        getError(schema, 'required', {
          code: 'REQUIRED_ERROR',
          message: 'Value is required',
        }),
        validationExp
      )
    : allowValues([null, undefined], validationExp)

const _wrapValidationExp = (
  schema: ResolvedSchema,
  validationExp: Expression | null
) =>
  fnPipe(_type.bind(null, schema), _required.bind(null, schema))(validationExp)

export const objectValidationResolver = (
  mapTypes = ['object']
): Alternative => [
  (schema) =>
    isPlainObject(schema) &&
    isPlainObject(schema.properties) &&
    mapTypes.includes(schema.type),
  (schema, context) => {
    const mapValidation = {
      path: context.path,
      validation: _wrapValidationExp(
        schema,
        _casesValidationExp(schema, [ENUM])
      ),
    }

    return Object.keys(schema.properties).reduce(
      (acc, key) => {
        return [
          ...acc,
          ...parseValidations(schema.properties[key], context.value, {
            ...context,
            path: pathJoin(context.path, key),
          }),
        ]
      },
      [mapValidation]
    )
  },
]

/**
 * @todo - Support `items` instead of `itemSchema` and add support for tuples
 */
export const arrayValidationResolver = (listTypes = ['array']): Alternative => [
  (schema) => isPlainObject(schema) && listTypes.includes(schema.type),
  (schema, context) => {
    //
    // For each item in the value, resolve thte item schema
    // and return parsed validations for the specific path
    //
    const itemSchema = schema.itemSchema

    const itemValidations = schema.itemSchema
      ? context.value.reduce((acc, itemValue, index) => {
          const schema = resolveSchema(itemSchema, {
            interpreters: context.interpreters,
            value: itemValue,
          })

          return [
            ...acc,
            ...parseValidations(schema, context.value, {
              ...context,
              path: pathJoin(context.path, index),
            }),
          ]
        }, [])
      : []

    const cases = parseValidationCases(schema, [
      ENUM,
      ARRAY_MIN_LENGTH,
      ARRAY_MAX_LENGTH,
      ARRAY_UNIQUE_ITEMS,
    ])

    return [
      {
        path: context.path,
        validation: _wrapValidationExp(schema, parallelCases(cases)),
      },
      ...itemValidations,
    ]
  },
]

export const _validationResolver = (
  types: string[],
  caseResolvers: Alternative[]
): Alternative => [
  (schema) => isPlainObject(schema) && types.includes(schema.type),
  (schema, context) => {
    return [
      {
        path: context.path,
        validation: _wrapValidationExp(
          schema,
          _casesValidationExp(schema, caseResolvers)
        ),
      },
    ]
  },
]

export const stringValidationResolver = (
  stringTypes = ['string']
): Alternative =>
  _validationResolver(stringTypes, [ENUM, STRING_MIN_LENGTH, STRING_MAX_LENGTH])

export const numberValidationResolver = (
  numberTypes = ['number']
): Alternative =>
  _validationResolver(numberTypes, [
    ENUM,
    NUMBER_MIN,
    NUMBER_MAX,
    NUMBER_MULTIPLE_OF,
  ])

export const defaultValidationResolver = (): Alternative => [
  (schema, context) => {
    return [
      {
        path: context.path,
        validation: _wrapValidationExp(
          schema,
          _casesValidationExp(schema, [ENUM])
        ),
      },
    ]
  },
]

const DEFAULT_RESOLVERS = [
  objectValidationResolver(),
  arrayValidationResolver(),
  stringValidationResolver(),
  numberValidationResolver(),
  defaultValidationResolver(),
]

/**
 * @todo parseValidations substitute treeSourceNodes for treeCollectNodes
 */
export const parseValidations = (
  schema: ResolvedSchema,
  value: any, // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
  context: ParseValidationsContext = {}
): ValidationSpec[] =>
  treeSourceNodes(schema, {
    resolvers: DEFAULT_RESOLVERS,
    ...context,
    value,
  }) as ValidationSpec[]
