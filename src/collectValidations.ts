import { isPlainObject } from 'lodash'
import {
  NodeCollector,
  NodeCollectorContext,
  treeCollectNodes,
  pathJoin,
} from '@orioro/tree-collect-nodes'
import { parallelCases, allowValues, prohibitValues } from '@orioro/validate'
import {
  DEFAULT_STRING_CASES,
  DEFAULT_NUMBER_CASES,
  DEFAULT_BOOLEAN_CASES,
  DEFAULT_ARRAY_CASES,
  DEFAULT_OBJECT_CASES,
  parseValidationCases,
} from './parseValidationCases'

import { Expression } from '@orioro/expression'

import { getError, fnPipe } from './util'
import { UnresolvedSchema, ResolvedSchema, ValidationSpec } from './types'

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

/**
 * @function validationCollectorObject
 */
export const validationCollectorObject = (
  objectTypes = ['object'],
  caseAlteratives = DEFAULT_OBJECT_CASES
): NodeCollector => [
  (schema) => isPlainObject(schema) && objectTypes.includes(schema.type),
  (schema, context: ParseValidationsContext): ValidationSpec[] => {
    if (!isPlainObject(schema.properties)) {
      throw new Error('Invalid object schema: missing properties object')
    }

    const objectCasesValidation: ValidationSpec = {
      path: typeof context.path === 'string' ? context.path : '',
      validationExpression: _wrapValidationExp(
        schema,
        _casesValidationExp(schema, caseAlteratives)
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
          ...collectValidations(
            {
              ...context,
              path: propertyPath,
            },
            propertySchema,
            propertyValue
          ),
        ]
      },
      [objectCasesValidation]
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
          const resolvedItemSchema = context.resolveSchema(
            schema.items,
            itemValue
          )

          return [
            ...acc,
            ...collectValidations(
              {
                ...context,
                path: pathJoin(context.path, index),
              },
              resolvedItemSchema,
              itemValue
            ),
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

          const resolvedItemSchema = context.resolveSchema(
            itemSchema,
            itemValue
          )

          return [
            ...acc,
            ...collectValidations(
              {
                ...context,
                path: pathJoin(context.path, index),
              },
              resolvedItemSchema,
              itemValue
            ),
          ]
        }, [])
      : //
        // schema.items is neither plain object nor array, simply ignore it
        //
        []
  }
}

/**
 * @function validationCollectorArray
 */
export const validationCollectorArray = (
  listTypes = ['array'],
  caseAlteratives = DEFAULT_ARRAY_CASES
): NodeCollector => [
  (schema) => isPlainObject(schema) && listTypes.includes(schema.type),
  (schema, context) => {
    const itemValidations = _parseItemValidations(schema, context)

    const cases = parseValidationCases(schema, caseAlteratives)

    return [
      {
        path: context.path,
        validationExpression: _wrapValidationExp(schema, parallelCases(cases)),
      },
      ...itemValidations,
    ]
  },
]

const _validationResolver = (
  types: string[],
  caseResolvers: NodeCollector[]
): NodeCollector => [
  (schema) => isPlainObject(schema) && types.includes(schema.type),
  (schema, context) => {
    return [
      {
        path: typeof context.path === 'string' ? context.path : '',
        validationExpression: _wrapValidationExp(
          schema,
          _casesValidationExp(schema, caseResolvers)
        ),
      },
    ]
  },
]

/**
 * @function validationCollectorString
 */
export const validationCollectorString = (
  stringTypes = ['string'],
  caseAlteratives = DEFAULT_STRING_CASES
): NodeCollector => _validationResolver(stringTypes, caseAlteratives)

/**
 * @function validationCollectorNumber
 */
export const validationCollectorNumber = (
  numberTypes = ['number'],
  caseAlteratives = DEFAULT_NUMBER_CASES
): NodeCollector => _validationResolver(numberTypes, caseAlteratives)

/**
 * @function validationCollectorBoolean
 */
export const validationCollectorBoolean = (
  booleanTypes = ['boolean'],
  caseAlteratives = DEFAULT_BOOLEAN_CASES
): NodeCollector => _validationResolver(booleanTypes, caseAlteratives)

/**
 * @function validationCollectorDefault
 */
export const validationCollectorDefault = (): NodeCollector => [
  (schema) => {
    throw new Error(`Validation collection failed. Unknown type ${schema.type}`)
  },
]

export type ParseValidationsContext = NodeCollectorContext & {
  collectors: NodeCollector[]
  resolveSchema: (schema: UnresolvedSchema, value: any) => ResolvedSchema
}

/**
 * @function collectValidations
 */
export const collectValidations = (
  context: ParseValidationsContext,
  schema: ResolvedSchema,
  value: any // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
): ValidationSpec[] =>
  treeCollectNodes(schema, {
    ...context,
    value,
  }) as ValidationSpec[]
