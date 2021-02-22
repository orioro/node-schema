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
  ARRAY_EXACT_LENGTH,
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
      validationExpression: _wrapValidationExp(
        schema,
        _casesValidationExp(schema, [ENUM])
      ),
    }

    return Object.keys(schema.properties).reduce(
      (acc, key) => {
        const propertySchema = schema.properties[key]
        const propertyValue = isPlainObject(context.value)
          ? context.value[key]
          : null
        const propertyPath = pathJoin(context.path, key)

        return [
          ...acc,
          ...parseValidations(propertySchema, propertyValue, {
            ...context,
            path: propertyPath,
          }),
        ]
      },
      [mapValidation]
    )
  },
]

const _parseItemValidations = (schema, context) => {
  if (!Array.isArray(context.value)) {
    return []
  } else {
    return isPlainObject(schema.items)
      ? //
        // If schema.items is a plain object, treat it as a schema definition:
        // for each item in the value, resolve thte item schema
        // and return parsed validations for the specific path
        //
        context.value.reduce((acc, itemValue, index) => {
          /**
           * @todo parseValidation resolveSchema method being called with no context
           *                       study better ways of making this call. E.g. expose
           *                       resolveSchema on context object
           */
          const resolvedItemSchema = resolveSchema(schema.items, itemValue)

          return [
            ...acc,
            ...parseValidations(resolvedItemSchema, itemValue, {
              ...context,
              path: pathJoin(context.path, index),
            }),
          ]
        }, [])
      : Array.isArray(schema.items)
      ? //
        // If schema.items is an Array, treat is as a tuple of schema definitions:
        // For each item schema defined in schema.items, generate validations
        // for the corresponding paths
        //
        schema.items.reduce((acc, itemSchema, index) => {
          const itemValue = context.value[index]

          /**
           * @todo parseValidation resolveSchema method being called with no context
           *                       study better ways of making this call. E.g. expose
           *                       resolveSchema on context object
           */
          const resolvedItemSchema = resolveSchema(itemSchema, itemValue)

          return [
            ...acc,
            ...parseValidations(resolvedItemSchema, itemValue, {
              ...context,
              path: pathJoin(context.path, index),
            }),
          ]
        }, [])
      : //
        // schema.items is neither plain object nor array, simply ignore it
        //
        []
  }
}

/**
 * @todo - Support `items` instead of `items` and add support for tuples
 */
export const arrayValidationResolver = (listTypes = ['array']): Alternative => [
  (schema) => isPlainObject(schema) && listTypes.includes(schema.type),
  (schema, context) => {
    const itemValidations = _parseItemValidations(schema, context)

    const cases = parseValidationCases(schema, [
      ENUM,
      ARRAY_MIN_LENGTH,
      ARRAY_MAX_LENGTH,
      ARRAY_EXACT_LENGTH,
      ARRAY_UNIQUE_ITEMS,
    ])

    return [
      {
        path: context.path,
        validationExpression: _wrapValidationExp(schema, parallelCases(cases)),
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
        validationExpression: _wrapValidationExp(
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
        validationExpression: _wrapValidationExp(
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
