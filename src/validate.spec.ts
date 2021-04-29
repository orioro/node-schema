import {
  validateSync,
  validateAsync,
  validateSyncThrow,
  validateAsyncThrow,
  ValidationError,
} from './validate'
import { schemaTypeExpressions } from './expressions'
import {
  resolveSchema,
  schemaResolverExpression,
  schemaResolverObject,
  schemaResolverArray,
  schemaResolverDefault,
} from './resolveSchema'
import {
  validationCollectorObject,
  validationCollectorArray,
  validationCollectorString,
  validationCollectorBoolean,
  validationCollectorISODate,
  validationCollectorNumber,
  validationCollectorDefault,
} from './collectValidations'

import { ALL_EXPRESSIONS, interpreterList } from '@orioro/expression'
import { DATE_EXPRESSIONS } from '@orioro/expression-date'

import {
  testCases,
  fnCallLabel,
  valueLabel,
  variableName,
  ExpectedResultFn,
} from '@orioro/jest-util'

const context = {
  collectors: [
    validationCollectorObject(),
    validationCollectorArray(),
    validationCollectorString(),
    validationCollectorNumber(),
    validationCollectorBoolean(),
    validationCollectorISODate(),
    validationCollectorDefault(),
  ],
  interpreters: interpreterList({
    ...ALL_EXPRESSIONS,
    ...DATE_EXPRESSIONS,
    ...schemaTypeExpressions(),
  }),
  resolveSchema: resolveSchema.bind(null, {
    resolvers: [
      schemaResolverExpression(),
      schemaResolverObject(),
      schemaResolverArray(),
      schemaResolverDefault(),
    ],
  }),
}

const _validationResultLabel = (result) =>
  typeof result === 'function'
    ? result
    : result === null
    ? 'null'
    : result.map((r) => r.code).join(', ')

const _matchObjectComparator = (expected) =>
  expected === null
    ? (result) => expect(result).toEqual(null)
    : (result) => expect(result).toMatchObject(expected)

const _testValidateCases = (
  cases,
  resultComparator = _matchObjectComparator
) => {
  const syncCases = cases.map((_case) => {
    const expected = _case[_case.length - 1]
    const args = _case.slice(0, _case.length - 1)

    const _result: ExpectedResultFn = resultComparator(expected)
    _result.label = _validationResultLabel(expected)

    return [...args, _result]
  })

  const asyncCases = cases.map((_case) => {
    const expected = _case[_case.length - 1]
    const args = _case.slice(0, _case.length - 1)

    const _result: ExpectedResultFn = (resultPromise) =>
      resultPromise.then((result) => resultComparator(expected)(result))
    _result.label = _validationResultLabel(expected)

    return [...args, _result]
  })

  testCases(
    syncCases,
    (schema, input, options) => validateSync(context, schema, input, options),
    ([, input, options], result) =>
      fnCallLabel(
        'validateSync',
        [variableName('context'), variableName('schema'), input, options],
        _validationResultLabel(result)
      )
  )

  testCases(
    asyncCases,
    (schema, input, options) => validateAsync(context, schema, input, options),
    ([, input, options], result) =>
      fnCallLabel(
        'validateAsync',
        [variableName('context'), variableName('schema'), input, options],
        _validationResultLabel(result)
      )
  )

  // Force test parallel mode as well
  testCases(
    asyncCases,
    (schema, input, options = {}) => {
      options = Array.isArray(options) ? { include: options } : options

      return validateAsync(context, schema, input, {
        ...options,
        mode: 'parallel',
      })
    },
    ([, input, options], result) =>
      fnCallLabel(
        'validateAsync[Parallel]',
        [variableName('context'), variableName('schema'), input, options],
        _validationResultLabel(result)
      )
  )
}

describe('REQUIRED_ERROR and TYPE_ERROR', () => {
  const MATCH_REQUIRED_ERROR = [{ code: 'REQUIRED_ERROR' }]
  const MATCH_TYPE_ERROR = [{ code: 'TYPE_ERROR' }]

  const expectations: [any[], { [type: string]: any }][] = [
    [
      [null, undefined],
      {
        string: MATCH_REQUIRED_ERROR,
        number: MATCH_REQUIRED_ERROR,
        boolean: MATCH_REQUIRED_ERROR,
        object: MATCH_REQUIRED_ERROR,
        array: MATCH_REQUIRED_ERROR,
        ISODate: MATCH_REQUIRED_ERROR,
      },
    ],
    [
      ['8', '', 'Some string'],
      {
        string: null,
        number: MATCH_TYPE_ERROR,
        boolean: MATCH_TYPE_ERROR,
        object: MATCH_TYPE_ERROR,
        array: MATCH_TYPE_ERROR,
        ISODate: MATCH_TYPE_ERROR,
      },
    ],
    [
      [9, 9.9, Infinity, -Infinity],
      {
        string: MATCH_TYPE_ERROR,
        number: null,
        boolean: MATCH_TYPE_ERROR,
        object: MATCH_TYPE_ERROR,
        array: MATCH_TYPE_ERROR,
        ISODate: MATCH_TYPE_ERROR,
      },
    ],
    [
      [true, false],
      {
        string: MATCH_TYPE_ERROR,
        number: MATCH_TYPE_ERROR,
        boolean: null,
        object: MATCH_TYPE_ERROR,
        array: MATCH_TYPE_ERROR,
        ISODate: MATCH_TYPE_ERROR,
      },
    ],
    [
      ['2021-02-25T18:00:00.000-03:00'],
      {
        string: null,
        number: MATCH_TYPE_ERROR,
        boolean: MATCH_TYPE_ERROR,
        object: MATCH_TYPE_ERROR,
        array: MATCH_TYPE_ERROR,
        ISODate: null,
      },
    ],
    [
      [
        {
          /* empty object */
        },
        // {},
      ],
      {
        string: MATCH_TYPE_ERROR,
        number: MATCH_TYPE_ERROR,
        boolean: MATCH_TYPE_ERROR,
        object: null,
        array: MATCH_TYPE_ERROR,
        ISODate: MATCH_TYPE_ERROR,
      },
    ],
    [
      [
        [
          /* empty array */
        ],
        ['1', 2, '3'],
      ],
      {
        string: MATCH_TYPE_ERROR,
        number: MATCH_TYPE_ERROR,
        boolean: MATCH_TYPE_ERROR,
        object: MATCH_TYPE_ERROR,
        array: null,
        ISODate: MATCH_TYPE_ERROR,
      },
    ],
    [
      [
        NaN,
        BigInt('7'),
        new Set(),
        new WeakSet(),
        new Map(),
        new WeakMap(),
        Symbol(),
        new Date(),
      ],
      {
        string: MATCH_TYPE_ERROR,
        number: MATCH_TYPE_ERROR,
        boolean: MATCH_TYPE_ERROR,
        object: MATCH_TYPE_ERROR,
        array: MATCH_TYPE_ERROR,
        ISODate: MATCH_TYPE_ERROR,
      },
    ],
  ]

  expectations.forEach(([inputs, resultByType]) => {
    inputs.forEach((input) => {
      Object.keys(resultByType).forEach((type) => {
        const result = resultByType[type]

        const inputLabel = valueLabel(input)
        const resultLabel = _validationResultLabel(result)
        const suiteLabel = `required ${type}: ${inputLabel} -> ${resultLabel}`

        const schema =
          type === 'object'
            ? {
                type,
                required: true,
                properties: {},
              }
            : {
                type,
                required: true,
              }

        if (result === null) {
          // eslint-disable-next-line jest/valid-title
          describe(suiteLabel, () => {
            test('validateSync', () =>
              expect(validateSync(context, schema, input)).toEqual(null))
            test('validateAsync - serial', () =>
              expect(
                validateAsync(context, schema, input, { mode: 'serial' })
              ).resolves.toEqual(null))
            test('validateAsync - parallel', () =>
              expect(
                validateAsync(context, schema, input, { mode: 'parallel' })
              ).resolves.toEqual(null))
          })
        } else {
          // eslint-disable-next-line jest/valid-title
          describe(suiteLabel, () => {
            test('validateSync', () =>
              expect(validateSync(context, schema, input)).toMatchObject(
                result
              ))
            test('validateAsync - serial', () =>
              expect(
                validateAsync(context, schema, input, { mode: 'serial' })
              ).resolves.toMatchObject(result))
            test('validateAsync - parallel', () =>
              expect(
                validateAsync(context, schema, input, { mode: 'parallel' })
              ).resolves.toMatchObject(result))
          })
        }
      })
    })
  })
})

describe('enum -> ENUM_ERROR', () => {
  describe('empty enum', () => {
    const schema = {
      type: 'string',
      enum: [],
    }

    _testValidateCases([
      [schema, 'a', [{ code: 'ENUM_ERROR' }]],
      [schema, 'b', [{ code: 'ENUM_ERROR' }]],
    ])
  })

  describe('string options', () => {
    const schema = {
      type: 'string',
      enum: ['opt_a', 'opt_b', 'opt_c'],
    }

    _testValidateCases([
      [schema, 'opt_a', null],
      [schema, 'opt_b', null],
      [schema, 'opt_c', null],
      [schema, 'opt_d', [{ code: 'ENUM_ERROR' }]],
      [schema, 1, [{ code: 'TYPE_ERROR' }]],
    ])
  })

  describe('number options', () => {
    const schema = {
      type: 'number',
      enum: [1, 2, 3],
    }

    _testValidateCases([
      [schema, 1, null],
      [schema, 2, null],
      [schema, 3, null],
      [schema, 4, [{ code: 'ENUM_ERROR' }]],
      [schema, '1', [{ code: 'TYPE_ERROR' }]],
    ])
  })
})

describe('string', () => {
  describe('minLength -> STRING_MIN_LENGTH_ERROR', () => {
    const schema = {
      type: 'string',
      minLength: 5,
    }

    _testValidateCases([
      [schema, '123', [{ code: 'STRING_MIN_LENGTH_ERROR' }]],
      [schema, '12345', null],
      [schema, '123456', null],
    ])
  })

  describe('maxLength -> STRING_MAX_LENGTH_ERROR', () => {
    const schema = {
      type: 'string',
      maxLength: 5,
    }

    _testValidateCases([
      [schema, '123', null],
      [schema, '12345', null],
      [schema, '123456', [{ code: 'STRING_MAX_LENGTH_ERROR' }]],
    ])
  })

  describe('simultaneous', () => {
    const schema = {
      type: 'string',
      minLength: 5,
      maxLength: 10,
    }

    _testValidateCases([
      [schema, '123', [{ code: 'STRING_MIN_LENGTH_ERROR' }]],
      [schema, '12345', null],
      [schema, '1234567', null],
      [schema, '1234567890', null],
      [schema, '12345678901', [{ code: 'STRING_MAX_LENGTH_ERROR' }]],
    ])
  })
})

describe('number', () => {
  describe('min -> NUMBER_MIN_ERROR', () => {
    const schema = {
      type: 'number',
      min: 5,
    }

    _testValidateCases([
      [schema, 4, [{ code: 'NUMBER_MIN_ERROR' }]],
      [schema, 5, null],
      [schema, 6, null],
    ])
  })

  describe('minExclusive -> NUMBER_MIN_ERROR', () => {
    const schema = {
      type: 'number',
      minExclusive: 5,
    }
    _testValidateCases([
      [schema, 4, [{ code: 'NUMBER_MIN_ERROR' }]],
      [schema, 5, [{ code: 'NUMBER_MIN_ERROR' }]],
      [schema, 6, null],
    ])
  })

  describe('max -> NUMBER_MAX_ERROR', () => {
    const schema = {
      type: 'number',
      max: 5,
    }

    _testValidateCases([
      [schema, 4, null],
      [schema, 5, null],
      [schema, 6, [{ code: 'NUMBER_MAX_ERROR' }]],
    ])
  })

  describe('maxExclusive -> NUMBER_MAX_ERROR', () => {
    const schema = {
      type: 'number',
      maxExclusive: 5,
    }

    _testValidateCases([
      [schema, 4, null],
      [schema, 5, [{ code: 'NUMBER_MAX_ERROR' }]],
      [schema, 6, [{ code: 'NUMBER_MAX_ERROR' }]],
    ])
  })

  describe('multipleOf -> NUMBER_MULTIPLE_OF_ERROR', () => {
    const schema = {
      type: 'number',
      multipleOf: 5,
    }

    _testValidateCases([
      [schema, 0, null],
      [schema, 5, null],
      [schema, 10, null],
      [schema, 3, [{ code: 'NUMBER_MULTIPLE_OF_ERROR' }]],
    ])
  })

  describe('simultaneous', () => {
    const schema = {
      type: 'number',
      minExclusive: 5,
      max: 20,
      multipleOf: 5,
    }

    _testValidateCases([
      [
        schema,
        4,
        [{ code: 'NUMBER_MIN_ERROR' }, { code: 'NUMBER_MULTIPLE_OF_ERROR' }],
      ],
      [schema, 5, [{ code: 'NUMBER_MIN_ERROR' }]],
      [schema, 6, [{ code: 'NUMBER_MULTIPLE_OF_ERROR' }]],
      [schema, 10, null],
      [schema, 20, null],
      [schema, 25, [{ code: 'NUMBER_MAX_ERROR' }]],
    ])
  })
})

describe('ISODate', () => {
  describe('min', () => {
    const schema = {
      type: 'ISODate',
      min: '2021-02-25T18:00:00.000-03:00',
    }

    _testValidateCases([
      [schema, '2021-02-25T18:00:00.000-03:00', null],
      [schema, '2021-02-25T19:00:00.000-03:00', null],
      [
        schema,
        '2021-02-25T17:00:00.000-03:00',
        [{ code: 'ISO_DATE_MIN_ERROR' }],
      ],
    ])
  })

  describe('minExclusive', () => {
    const schema = {
      type: 'ISODate',
      minExclusive: '2021-02-25T18:00:00.000-03:00',
    }

    _testValidateCases([
      [
        schema,
        '2021-02-25T18:00:00.000-03:00',
        [{ code: 'ISO_DATE_MIN_ERROR' }],
      ],
      [schema, '2021-02-25T19:00:00.000-03:00', null],
      [
        schema,
        '2021-02-25T17:00:00.000-03:00',
        [{ code: 'ISO_DATE_MIN_ERROR' }],
      ],
    ])
  })

  describe('max', () => {
    const schema = {
      type: 'ISODate',
      max: '2021-02-25T18:00:00.000-03:00',
    }

    _testValidateCases([
      [schema, '2021-02-25T18:00:00.000-03:00', null],
      [
        schema,
        '2021-02-25T19:00:00.000-03:00',
        [{ code: 'ISO_DATE_MAX_ERROR' }],
      ],
      [schema, '2021-02-25T17:00:00.000-03:00', null],
    ])
  })

  describe('maxExclusive', () => {
    const schema = {
      type: 'ISODate',
      maxExclusive: '2021-02-25T18:00:00.000-03:00',
    }

    _testValidateCases([
      [
        schema,
        '2021-02-25T18:00:00.000-03:00',
        [{ code: 'ISO_DATE_MAX_ERROR' }],
      ],
      [
        schema,
        '2021-02-25T19:00:00.000-03:00',
        [{ code: 'ISO_DATE_MAX_ERROR' }],
      ],
      [schema, '2021-02-25T17:00:00.000-03:00', null],
    ])
  })
})

describe('array', () => {
  describe('minLength -> ARRAY_MIN_LENGTH_ERROR', () => {
    const schema = {
      type: 'array',
      minLength: 3,
    }

    _testValidateCases([
      [schema, [], [{ code: 'ARRAY_MIN_LENGTH_ERROR' }]],
      [schema, [0], [{ code: 'ARRAY_MIN_LENGTH_ERROR' }]],
      [schema, [0, 1, 2], null],
      [schema, [0, 1, 2, 3, 4, 5], null],
    ])
  })

  describe('maxLength -> ARRAY_MAX_LENGTH_ERROR', () => {
    const schema = {
      type: 'array',
      maxLength: 3,
    }

    _testValidateCases([
      [schema, [], null],
      [schema, [0], null],
      [schema, [0, 1, 2], null],
      [schema, [0, 1, 2, 3, 4, 5], [{ code: 'ARRAY_MAX_LENGTH_ERROR' }]],
    ])
  })

  describe('uniqueItems -> ARRAY_UNIQUE_ITEMS_ERROR', () => {
    const schema = {
      type: 'array',
      uniqueItems: true,
    }

    _testValidateCases([
      [schema, [], null],
      [schema, [0], null],
      [schema, [0, 1, 2], null],
      [schema, [0, 1, 2, 0], [{ code: 'ARRAY_UNIQUE_ITEMS_ERROR' }]],
      [schema, [{}, {}], [{ code: 'ARRAY_UNIQUE_ITEMS_ERROR' }]],
      [
        schema,
        [
          { key1: 'value1', key2: 'value2' },
          { key1: 'value1', key2: 'value2' },
        ],
        [{ code: 'ARRAY_UNIQUE_ITEMS_ERROR' }],
      ],
      [
        schema,
        [
          { key1: 'value1', key2: 'value2' },
          { key1: 'ANOTHER_VALUE', key2: 'value2' },
        ],
        null,
      ],
    ])
  })

  describe('items: immediately nested values - array -> string', () => {
    const schema = {
      type: 'array',
      items: {
        type: 'string',
        required: true,
        minLength: 5,
        maxLength: 10,
      },
    }

    _testValidateCases([
      [schema, ['12345', '1234567', '1234567890'], null],
      [
        schema,
        ['1234', '123', '12345', '12345678901'],
        [
          { path: '0', code: 'STRING_MIN_LENGTH_ERROR' },
          { path: '1', code: 'STRING_MIN_LENGTH_ERROR' },
          { path: '3', code: 'STRING_MAX_LENGTH_ERROR' },
        ],
      ],
      [
        schema,
        [1, '12345', '123'],
        [
          { path: '0', code: 'TYPE_ERROR' },
          { path: '2', code: 'STRING_MIN_LENGTH_ERROR' },
        ],
      ],
    ])
  })

  describe('items: nested - array -> object', () => {
    const schema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          strRequired: {
            type: 'string',
            required: true,
          },
          strMinLen5: {
            type: 'string',
            minLength: 5,
          },
        },
      },
    }

    _testValidateCases([
      [schema, null, null],
      [schema, [], null],
      [
        schema,
        [
          { strRequired: 'some string', strMinLen5: '12345' },
          { strRequired: 'another string', strMinLen5: '123456' },
        ],
        null,
      ],
      [
        schema,
        [{ strMinLen5: '12345' }, { strMinLen5: '1234' }],
        [
          { code: 'REQUIRED_ERROR', path: '0.strRequired' },
          { code: 'REQUIRED_ERROR', path: '1.strRequired' },
          { code: 'STRING_MIN_LENGTH_ERROR', path: '1.strMinLen5' },
        ],
      ],
    ])
  })

  describe('items: nested - array -> array -> object', () => {
    const schema = {
      type: 'array',
      items: {
        type: 'array',
        minLength: 2,
        items: {
          type: 'object',
          properties: {
            strRequired: {
              type: 'string',
              required: true,
            },
            strMinLen5: {
              type: 'string',
              minLength: 5,
            },
          },
        },
      },
    }

    _testValidateCases([
      [
        schema,
        // input:
        [
          [
            { strRequired: 'some string', strMinLen5: '12345' },
            { strRequired: 'another string', strMinLen5: '123456' },
          ],
          [
            { strRequired: 'yet another string', strMinLen5: '123456' },
            { strRequired: 'yet another string', strMinLen5: '12345678' },
          ],
        ],
        // expected result:
        null,
      ],

      [
        schema,
        // input:
        [
          [{ strMinLen5: '12345' }, { strRequired: 'another string' }],
          [{ strRequired: 'yet another string', strMinLen5: '123' }],
          [{ strMinLen5: '123' }],
        ],
        // expected result:
        [
          { code: 'REQUIRED_ERROR', path: '0.0.strRequired' },
          { code: 'ARRAY_MIN_LENGTH_ERROR', path: '1' },
          { code: 'STRING_MIN_LENGTH_ERROR', path: '1.0.strMinLen5' },
          { code: 'ARRAY_MIN_LENGTH_ERROR', path: '2' },
          { code: 'REQUIRED_ERROR', path: '2.0.strRequired' },
          { code: 'STRING_MIN_LENGTH_ERROR', path: '2.0.strMinLen5' },
        ],
      ],
    ])
  })

  describe('items: nested - array -> object -> array -> value', () => {
    const schema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          strRequired: {
            type: 'string',
            required: true,
          },
          strMinLen5: {
            type: 'string',
            minLength: 5,
          },
          arrayMinLen1: {
            type: 'array',
            minLength: 1,
            items: {
              type: 'string',
              maxLength: 4,
            },
          },
        },
      },
    }

    _testValidateCases([
      [
        schema,
        [
          { strRequired: 'str1', strMinLen5: '12345', arrayMinLen1: [null] },
          {
            strRequired: 'str2',
            strMinLen5: '12345',
            arrayMinLen1: ['1234', null, '123'],
          },
        ],
        null,
      ],
      [
        schema,
        [
          { strMinLen5: '12345', arrayMinLen1: [] },
          {
            strRequired: 'str2',
            strMinLen5: '123',
            arrayMinLen1: [1, null, '12345678'],
          },
        ],
        [
          { code: 'REQUIRED_ERROR', path: '0.strRequired' },
          { code: 'ARRAY_MIN_LENGTH_ERROR', path: '0.arrayMinLen1' },
          { code: 'STRING_MIN_LENGTH_ERROR', path: '1.strMinLen5' },
          { code: 'TYPE_ERROR', path: '1.arrayMinLen1.0' },
          { code: 'STRING_MAX_LENGTH_ERROR', path: '1.arrayMinLen1.2' },
        ],
      ],
    ])
  })

  describe('items: as tuple', () => {
    const schema = {
      type: 'array',
      items: [
        {
          type: 'string',
          required: true,
        },
        {
          type: 'number',
          min: 50,
          max: 100,
        },
        {
          type: 'object',
          properties: {
            strRequired: {
              type: 'string',
              required: true,
            },
            strMinLen5: {
              type: 'string',
              minLength: 5,
            },
          },
        },
        {
          type: 'array',
          items: {
            type: 'string',
            required: true,
          },
          minLength: 2,
        },
      ],
    }

    _testValidateCases([
      [
        schema,
        [
          'some string',
          50,
          {
            strRequired: 'another str',
            strMinLen5: '12345',
          },
          ['str1', 'str2'],
        ],
        null,
      ],
      [
        schema,
        ['Some string', 49, { strMinLen5: '123' }, [0]],
        [
          { code: 'NUMBER_MIN_ERROR', path: '1' },
          { code: 'REQUIRED_ERROR', path: '2.strRequired' },
          { code: 'STRING_MIN_LENGTH_ERROR', path: '2.strMinLen5' },
          { code: 'ARRAY_MIN_LENGTH_ERROR', path: '3' },
          { code: 'TYPE_ERROR', path: '3.0' },
        ],
      ],
      [
        schema,
        [
          'some string',
          50,
          {
            strRequired: 'another str',
            strMinLen5: '12345',
          },
        ],
        [{ code: 'ARRAY_EXACT_LENGTH_ERROR', path: '' }],
      ],
    ])
  })
})

describe('object', () => {
  const strRequired = {
    type: 'string',
    required: true,
  }

  const strOptional = {
    type: 'string',
  }

  const strMinLen5 = {
    type: 'string',
    minLength: 5,
  }

  const numMin5 = {
    type: 'number',
    min: 5,
  }

  const arrayMinLen1 = {
    type: 'array',
    minLength: 1,
  }

  const objSchema1 = {
    type: 'object',
    properties: {
      strRequired,
      strOptional,
      strMinLen5,
      numMin5,
      arrayMinLen1,
    },
  }

  const objSchema2 = {
    type: 'object',
    properties: {
      objSchema1,
      strRequired,
    },
  }

  describe('properties: immediately nested properties errors', () => {
    const schema = objSchema1

    _testValidateCases([
      [schema, null, [{ path: 'strRequired', code: 'REQUIRED_ERROR' }]],
      [schema, {}, [{ path: 'strRequired', code: 'REQUIRED_ERROR' }]],
      [schema, { strRequired: 'some string' }, null],
      [
        schema,
        {
          strRequired: null,
          strMinLen5: '1234',
          numMin5: 4,
          arrayMinLen1: [],
        },
        [
          { path: 'strRequired', code: 'REQUIRED_ERROR' },
          { path: 'strMinLen5', code: 'STRING_MIN_LENGTH_ERROR' },
          { path: 'numMin5', code: 'NUMBER_MIN_ERROR' },
          { path: 'arrayMinLen1', code: 'ARRAY_MIN_LENGTH_ERROR' },
        ],
      ],
      [
        schema,
        {
          strRequired: 'some string',
          strMinLen5: '12345',
          numMin5: 5,
          arrayMinLen1: ['1'],
        },
        null,
      ],

      // path options
      [schema, {}, ['strOptional'], null],
      [schema, {}, { skip: ['strRequired'] }, null],
      [
        schema,
        {},
        { skip: ['strOptional'] },
        [{ path: 'strRequired', code: 'REQUIRED_ERROR' }],
      ],
    ])
  })

  describe('properties: if given any unknown property, should fail validation', () => {
    const schema = objSchema1

    _testValidateCases([
      [
        schema,
        {
          strRequired: 'some string',
          strMinLen5: '12345',
          numMin5: 5,
          arrayMinLen1: ['1'],
          unknownProp: 'UNKNOWN_VALUE',
        },
        [{ code: 'OBJECT_UNKNOWN_PROPERTIES_ERROR', path: '' }],
      ],
    ])
  })

  describe('properties: nested errors - object -> object -> value', () => {
    const schema = objSchema2

    _testValidateCases([
      [
        schema,
        null,
        [
          { path: 'objSchema1.strRequired', code: 'REQUIRED_ERROR' },
          { path: 'strRequired', code: 'REQUIRED_ERROR' },
        ],
      ],
    ])
  })

  describe('properties: nested errors - object -> array -> object -> value', () => {
    const schema = {
      type: 'object',
      properties: {
        strRequired,
        arrayNested: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strRequired,
              strMinLen5,
            },
          },
          minLength: 3,
        },
      },
    }

    _testValidateCases([
      [
        schema,
        {
          strRequired: 'str_1',
          arrayNested: [
            { strRequired: 'str_2', strMinLen5: '12345' },
            { strRequired: 'str_3', strMinLen5: '123456' },
            { strRequired: 'str_4', strMinLen5: '12345' },
          ],
        },
        null,
      ],
      [
        schema,
        {
          arrayNested: [
            { strMinLen5: '1234' },
            { strRequired: 'str_3', strMinLen5: '123' },
          ],
        },
        [
          { code: 'REQUIRED_ERROR', path: 'strRequired' },
          { code: 'ARRAY_MIN_LENGTH_ERROR', path: 'arrayNested' },
          { code: 'REQUIRED_ERROR', path: 'arrayNested.0.strRequired' },
          { code: 'STRING_MIN_LENGTH_ERROR', path: 'arrayNested.0.strMinLen5' },
          { code: 'STRING_MIN_LENGTH_ERROR', path: 'arrayNested.1.strMinLen5' },
        ],
      ],
      [
        schema,
        {
          arrayNested: [
            { strMinLen5: '1234' },
            { strRequired: 'str_3', strMinLen5: '123' },
          ],
        },
        { include: ['strRequired'] },
        [{ code: 'REQUIRED_ERROR', path: 'strRequired' }],
      ],
    ])
  })

  describe('properties: interdependent values custom validation cases', () => {
    const schema = {
      type: 'object',
      properties: {
        maxLength: {
          type: 'number',
          required: true,
        },
        minLength: {
          type: 'number',
          required: true,
        },
        value: {
          type: 'string',
          required: true,
        },
      },
      validation: [
        [
          [
            '$gte',
            ['$value', 'minLength'],
            ['$stringLength', ['$value', 'value']],
          ],
          { code: 'CUSTOM_MIN_LENGTH_ERROR' },
        ],
        [
          [
            '$lte',
            ['$value', 'maxLength'],
            ['$stringLength', ['$value', 'value']],
          ],
          { code: 'CUSTOM_MAX_LENGTH_ERROR' },
        ],
      ],
    }

    _testValidateCases([
      [schema, { minLength: 5, maxLength: 10, value: '12345678' }, null],
      [
        schema,
        { minLength: 5, maxLength: 10, value: '123' },
        [{ code: 'CUSTOM_MIN_LENGTH_ERROR', path: '' }],
      ],
      [schema, { minLength: 3, maxLength: 10, value: '123' }, null],
      [
        schema,
        { minLength: 3, maxLength: 10, value: '12345678901' },
        [{ code: 'CUSTOM_MAX_LENGTH_ERROR', path: '' }],
      ],
    ])
  })

  describe('properties: interdependent values custom validation cases - realistic example', () => {
    const schema = {
      type: 'object',
      properties: {
        givenName: {
          type: 'string',
          required: true,
        },
        familyName: {
          type: 'string',
        },
        role: {
          type: 'string',
          required: true,
          enum: ['passenger', 'driver'],
        },
        age: {
          type: 'number',
          required: true,
        },
      },
      validation: [
        [
          [
            '$if',
            ['$eq', 'driver', ['$value', 'role']],
            ['$gte', 18, ['$value', 'age']],
            true,
          ],
          {
            code: 'DRIVER_MIN_AGE_18',
            // Set path on the error spec
            path: 'age',
          },
        ],
      ],
    }

    _testValidateCases([
      [
        schema,
        {
          givenName: 'João',
          familyName: 'Silva',
          role: 'driver',
          age: 20,
        },
        null,
      ],
      [
        schema,
        {
          givenName: 'João',
          familyName: 'Silva',
          role: 'driver',
          age: 17,
        },
        [{ code: 'DRIVER_MIN_AGE_18', path: 'age' }],
      ],
      [
        schema,
        {
          role: 'driver',
          age: 17,
        },
        [
          { code: 'DRIVER_MIN_AGE_18', path: 'age' },
          { code: 'REQUIRED_ERROR', path: 'givenName' },
        ],
      ],
    ])
  })
})

describe('validate[Sync/Async]Throw', () => {
  test('validateSyncThrow', () => {
    const schema = {
      type: 'string',
      minLength: 5,
    }

    expect(validateSyncThrow(context, schema, '12345')).toEqual(undefined)
    expect(() => validateSyncThrow(context, schema, '1234')).toThrow(
      ValidationError
    )
  })

  test('validateAsyncThrow - serial', () => {
    const schema = {
      type: 'string',
      minLength: 5,
    }

    return expect(
      validateAsyncThrow(context, schema, '1234', { mode: 'serial' })
    ).rejects.toThrow(ValidationError)
  })

  test('validateAsyncThrow - parallel', () => {
    const schema = {
      type: 'string',
      minLength: 5,
    }

    return expect(
      validateAsyncThrow(context, schema, '1234', { mode: 'parallel' })
    ).rejects.toThrow(ValidationError)
  })
})
