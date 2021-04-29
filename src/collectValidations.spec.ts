import {
  prepareValidate,
  allowValues,
  prohibitValues,
  parallelCases,
} from '@orioro/validate'

import { schemaTypeExpressions, CORE_SCHEMA_TYPES } from './expressions'
import { ResolvedSchema } from './types'

import { ALL_EXPRESSIONS, interpreterList } from '@orioro/expression'

import {
  resolveSchema as resolveSchema_,
  schemaResolverObject,
  schemaResolverArray,
  schemaResolverExpression,
  schemaResolverDefault,
} from './resolveSchema'

import {
  collectValidations,
  validationCollectorObject,
  validationCollectorArray,
  validationCollectorDefault,
  validationCollectorString,
  validationCollectorNumber,
} from './collectValidations'

import { testCases, fnCallLabel, variableName } from '@orioro/jest-util'

const resolveSchema = resolveSchema_.bind(null, {
  resolvers: [
    schemaResolverExpression(),
    schemaResolverObject(),
    schemaResolverArray(),
    schemaResolverDefault(),
  ],
})

const REQUIRED_ERROR = {
  code: 'REQUIRED_ERROR',
  message: 'This value is required',
}

const TYPE_ERROR = {
  code: 'TYPE_ERROR',
  message: 'Invalid type',
}

const { validateSync } = prepareValidate({
  interpreters: interpreterList({
    ...ALL_EXPRESSIONS,
    ...schemaTypeExpressions(CORE_SCHEMA_TYPES),
  }),
})

describe('collectValidations(schema, context) - required / optional', () => {
  test('required', () => {
    const schema = {
      type: 'string',
      required: true,
      errors: {
        required: REQUIRED_ERROR,
        type: TYPE_ERROR,
      },
    }

    const validations = collectValidations(
      {
        collectors: [
          validationCollectorObject(),
          validationCollectorString(),
          validationCollectorDefault(),
        ],
        resolveSchema,
      },
      schema,
      undefined
    )

    expect(validations).toEqual([
      {
        path: '',
        validationExpression: prohibitValues(
          [null, undefined],
          REQUIRED_ERROR,
          ['$if', ['$isSchemaType', 'string'], null, TYPE_ERROR]
        ),
      },
    ])

    const expectations = [
      [null, [REQUIRED_ERROR]],
      [undefined, [REQUIRED_ERROR]],
      [9, [TYPE_ERROR]],
      ['some text', null],
    ]

    expectations.forEach(([input, expected]) => {
      expect(validateSync(validations[0].validationExpression, input)).toEqual(
        expected
      )
    })
  })

  test('optional', () => {
    const schema = {
      type: 'string',
      errors: {
        type: TYPE_ERROR,
      },
    }

    const validations = collectValidations(
      {
        collectors: [
          validationCollectorObject(),
          validationCollectorString(),
          validationCollectorDefault(),
        ],
        resolveSchema,
      },
      schema,
      undefined
    )

    expect(validations).toMatchObject([
      {
        path: '',
        validationExpression: allowValues(
          [null, undefined],
          ['$if', ['$isSchemaType', 'string'], null, { code: 'TYPE_ERROR' }]
        ),
      },
    ])

    const expectations = [
      [null, null],
      [undefined, null],
      [9, [TYPE_ERROR]],
      ['some text', null],
    ]

    expectations.forEach(([input, expected]) => {
      expect(validateSync(validations[0].validationExpression, input)).toEqual(
        expected
      )
    })
  })
})

test('string validations', () => {
  const MIN_LENGTH_ERROR = {
    code: 'MIN_LENGTH_ERROR',
    message: 'Text must have at least 1 char',
  }

  const MAX_LENGTH_ERROR = {
    code: 'MAX_LENGTH_ERROR',
    message: 'Text must have at most 10 chars',
  }

  const schema = {
    type: 'string',
    required: true,
    minLength: 5,
    maxLength: 10,
    pattern: ['^a.+z$', 'i'],
    errors: {
      required: REQUIRED_ERROR,
      type: TYPE_ERROR,
      minLength: MIN_LENGTH_ERROR,
      maxLength: MAX_LENGTH_ERROR,
    },
  }

  const validations = collectValidations(
    {
      collectors: [validationCollectorString(), validationCollectorDefault()],
      resolveSchema,
    },
    schema,
    'Some text'
  )

  expect(validations).toEqual([
    {
      path: '',
      validationExpression: prohibitValues([null, undefined], REQUIRED_ERROR, [
        '$if',
        ['$isSchemaType', 'string'],
        parallelCases([
          [['$gte', 5, ['$stringLength']], MIN_LENGTH_ERROR],
          [['$lte', 10, ['$stringLength']], MAX_LENGTH_ERROR],
        ]),
        TYPE_ERROR,
      ]),
    },
  ])

  const expectations = [
    [null, [REQUIRED_ERROR]],
    [undefined, [REQUIRED_ERROR]],
    [9, [TYPE_ERROR]],
    ['a', [MIN_LENGTH_ERROR]],
    ['abcdefghijklmnopqrstuv', [MAX_LENGTH_ERROR]],
    ['abcdez', null],
    ['AbcdeZ', null],
  ]

  expectations.forEach(([input, expected]) => {
    expect(validateSync(validations[0].validationExpression, input)).toEqual(
      expected
    )
  })
})

describe('array validations', () => {
  const MIN_LENGTH_ERROR = {
    code: 'MIN_LENGTH_ERROR',
  }

  const MAX_LENGTH_ERROR = {
    code: 'MAX_LENGTH_ERROR',
  }

  const schema = {
    type: 'array',
    items: {
      type: 'string',
      required: true,
      minLength: 5,
      maxLength: 10,
      errors: {
        required: REQUIRED_ERROR,
        type: TYPE_ERROR,
        minLength: MIN_LENGTH_ERROR,
        maxLength: MAX_LENGTH_ERROR,
      },
    },
  }

  test('basic', () => {
    const validations = collectValidations(
      {
        collectors: [
          validationCollectorArray(),
          validationCollectorString(),
          validationCollectorDefault(),
        ],
        resolveSchema,
      },
      schema,
      ['123', '12345', '1234567', '123456789012345']
    )

    expect(validations).toMatchSnapshot()
  })
})

describe('object validations', () => {
  const REQUIRED_STRING = {
    type: 'string',
    required: true,
  }

  const REQUIRED_NUMBER = {
    type: 'number',
    required: true,
  }

  const schemaSimple: ResolvedSchema = {
    type: 'object',
    properties: {
      key1: REQUIRED_STRING,
      key2: REQUIRED_STRING,
      key3: REQUIRED_STRING,
      key4: REQUIRED_STRING,
    },
  }

  const schemaComplex: ResolvedSchema = {
    type: 'object',
    properties: {
      key1: REQUIRED_STRING,
      key2: REQUIRED_NUMBER,
      key3: {
        type: 'object',
        properties: {
          key31: REQUIRED_STRING,
          key32: REQUIRED_NUMBER,
        },
      },
      key4: {
        type: 'object',
        properties: {
          key41: REQUIRED_STRING,
          key42: {
            type: 'object',
            properties: {
              key421: REQUIRED_NUMBER,
              key422: REQUIRED_STRING,
            },
          },
          key43: REQUIRED_NUMBER,
        },
      },
    },
  }

  const context = {
    collectors: [
      validationCollectorObject(),
      validationCollectorString(),
      validationCollectorNumber(),
      validationCollectorDefault(),
    ],
    resolveSchema,
  }

  test('basic', () => {
    const validations = collectValidations(context, schemaComplex, {})

    expect(validations).toMatchSnapshot()

    expect(validations.map((v) => v.path)).toEqual([
      '',
      'key1',
      'key2',
      'key3',
      'key3.key31',
      'key3.key32',
      'key4',
      'key4.key41',
      'key4.key42',
      'key4.key42.key421',
      'key4.key42.key422',
      'key4.key43',
    ])
  })

  describe('pathOptions', () => {
    testCases(
      [
        [{ include: ['key1', 'key4'] }, schemaSimple, ['key1', 'key4']],
        [{ include: ['key1', 'key4'] }, schemaComplex, ['key1', 'key4']],
        [
          { includePattern: ['key1', 'key4'] },
          schemaComplex,
          [
            'key1',
            'key4',
            'key4.key41',
            'key4.key42',
            'key4.key42.key421',
            'key4.key42.key422',
            'key4.key43',
          ],
        ],
        [
          { skipPattern: ['key1', 'key4'] },
          schemaComplex,
          ['', 'key2', 'key3', 'key3.key31', 'key3.key32'],
        ],
      ],
      (pathOptions, schema) => {
        return collectValidations(
          {
            ...context,
            pathOptions,
          },
          schema,
          {}
        ).map((v) => v.path)
      },
      ([pathOptions, schema], result) =>
        fnCallLabel(
          'collectValidations - pathOptions',
          [
            pathOptions,
            variableName(
              schema === schemaSimple ? 'schemaSimple' : 'schemaComplex'
            ),
          ],
          result
        )
    )
  })
})
