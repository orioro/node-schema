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

export const STRING_PATTERN: Alternative = [
  (schema: ResolvedSchema): boolean =>
    typeof schema.pattern === 'string' || Array.isArray(schema.pattern),
  (schema: ResolvedSchema): ValidationCase => [
    ['$stringTest', schema.pattern],
    getError(schema, 'pattern', {
      code: 'STRING_PATTERN_ERROR',
    }),
  ],
]

export const NUMBER_MIN: Alternative = [
  (schema: ResolvedSchema): boolean => typeof schema.min === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    ['$gte', schema.min],
    getError(schema, 'min', {
      code: 'NUMBER_MIN_ERROR',
    }),
  ],
]

export const NUMBER_MIN_EXCLUSIVE: Alternative = [
  (schema: ResolvedSchema): boolean => typeof schema.minExclusive === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    ['$gt', schema.minExclusive],
    getError(schema, 'minExclusive', {
      code: 'NUMBER_MIN_EXCLUSIVE_ERROR',
    }),
  ],
]

export const NUMBER_MAX: Alternative = [
  (schema: ResolvedSchema): boolean => typeof schema.max === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    ['$lte', schema.max],
    getError(schema, 'max', {
      code: 'NUMBER_MAX_ERROR',
    }),
  ],
]

export const NUMBER_MAX_EXCLUSIVE: Alternative = [
  (schema: ResolvedSchema): boolean => typeof schema.maxExclusive === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    ['$lt', schema.maxExclusive],
    getError(schema, 'maxExclusive', {
      code: 'NUMBER_MAX_EXCLUSIVE_ERROR',
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

export const LIST_MIN_LENGTH: Alternative = [
  (schema: ResolvedSchema): boolean => typeof schema.minLength === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    ['$gte', schema.minLength, ['$arrayLength']],
    getError(schema, 'minLength', {
      code: 'LIST_MIN_LENGTH_ERROR',
    }),
  ],
]

export const LIST_MAX_LENGTH: Alternative = [
  (schema: ResolvedSchema): boolean => typeof schema.maxLength === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    ['$lte', schema.maxLength, ['$arrayLength']],
    getError(schema, 'maxLength', {
      code: 'LIST_MAX_LENGTH_ERROR',
    }),
  ],
]

export const LIST_UNIQUE_ITEMS: Alternative = [
  (schema: ResolvedSchema): boolean => Boolean(schema.uniqueItems),
  (schema: ResolvedSchema): ValidationCase => [
    [
      '$arrayEvery',
      [
        '$eq',
        ['$value', '$$INDEX'],
        ['$arrayIndexOf', ['$value', '$$VALUE'], ['$value', '$$ARRAY']],
      ],
    ],
    getError(schema, 'uniqueItems', {
      code: 'LIST_UNIQUE_ITEMS_ERROR',
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
