import { Alternative, cascadeFilter, test } from '@orioro/cascade'
import { ValidationCase } from '@orioro/validate'
import { getError } from './util'
import { ResolvedSchema } from './types'

export const ENUM: Alternative = [
  (schema: ResolvedSchema): boolean => Array.isArray(schema.enum),
  (schema: ResolvedSchema): ValidationCase => {
    const enum_ = schema.enum as any[]

    return [
      ['$in', schema.enum],
      getError(schema, 'enum', {
        code: 'ENUM_ERROR',
        message: `Must be one of ${enum_.join(', ')}`,
      }),
    ]
  },
]

export const STRING_MIN_LENGTH: Alternative = [
  (schema: ResolvedSchema): boolean => typeof schema.minLength === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    ['$gte', schema.minLength, ['$stringLength']],
    getError(schema, 'minLength', {
      code: 'STRING_MIN_LENGTH_ERROR',
    }),
  ],
]

export const STRING_MAX_LENGTH: Alternative = [
  (schema: ResolvedSchema): boolean => typeof schema.maxLength === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    ['$lte', schema.maxLength, ['$stringLength']],
    getError(schema, 'maxLength', {
      code: 'STRING_MAX_LENGTH_ERROR',
    }),
  ],
]

export const NUMBER_MIN: Alternative = [
  (schema: ResolvedSchema): boolean =>
    typeof schema.min === 'number' || typeof schema.minExclusive === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    typeof schema.minExclusive === 'number'
      ? ['$gt', schema.minExclusive]
      : ['$gte', schema.min],
    getError(schema, 'min', {
      code: 'NUMBER_MIN_ERROR',
    }),
  ],
]

export const NUMBER_MAX: Alternative = [
  (schema: ResolvedSchema): boolean =>
    typeof schema.max === 'number' || typeof schema.maxExclusive === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    typeof schema.maxExclusive === 'number'
      ? ['$lt', schema.maxExclusive]
      : ['$lte', schema.max],
    getError(schema, 'max', {
      code: 'NUMBER_MAX_ERROR',
    }),
  ],
]

export const NUMBER_MULTIPLE_OF: Alternative = [
  (schema: ResolvedSchema): boolean => typeof schema.multipleOf === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    ['$eq', 0, ['$mathMod', schema.multipleOf]],
    getError(schema, 'multipleOf', {
      code: 'NUMBER_MULTIPLE_OF_ERROR',
    }),
  ],
]

export const ARRAY_MIN_LENGTH: Alternative = [
  (schema: ResolvedSchema): boolean => typeof schema.minLength === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    ['$gte', schema.minLength, ['$arrayLength']],
    getError(schema, 'minLength', {
      code: 'ARRAY_MIN_LENGTH_ERROR',
    }),
  ],
]

export const ARRAY_MAX_LENGTH: Alternative = [
  (schema: ResolvedSchema): boolean => typeof schema.maxLength === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    ['$lte', schema.maxLength, ['$arrayLength']],
    getError(schema, 'maxLength', {
      code: 'ARRAY_MAX_LENGTH_ERROR',
    }),
  ],
]

export const ARRAY_UNIQUE_ITEMS: Alternative = [
  (schema: ResolvedSchema): boolean => Boolean(schema.uniqueItems),
  (schema: ResolvedSchema): ValidationCase => [
    [
      '$arrayEvery',
      [
        '$eq',
        ['$value', '$$INDEX'],
        [
          '$arrayFindIndex',
          ['$eq', ['$value', '$$PARENT_SCOPE.$$VALUE']],
          ['$value', '$$ARRAY'],
        ],
        // ['$arrayIndexOf', ['$value', '$$VALUE'], ['$value', '$$ARRAY']],
      ],
    ],
    getError(schema, 'uniqueItems', {
      code: 'ARRAY_UNIQUE_ITEMS_ERROR',
    }),
  ],
]

export const parseValidationCases = (
  schema: ResolvedSchema,
  resolvers: Alternative[]
): ValidationCase[] => {
  const parsedCases = cascadeFilter(
    test,
    resolvers,
    schema
  ).map((prepareCase) => prepareCase(schema))

  const schemaCases = Array.isArray(schema.validation) ? schema.validation : []

  return [...parsedCases, ...schemaCases]
}
