import {
  validate as validate_,
  validateThrow as validateThrow_,
  ValidationError,
} from './validate'
import { schemaTypeExpression } from './expressions'
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
  validationCollectorNumber,
  validationCollectorDefault,
} from './collectValidations'

import { ALL_EXPRESSIONS } from '@orioro/expression'

import {
  _valueLabel,
  _validationResultLabel,
  _generateTests,
} from '../test/util/generateTests'

const context = {
  collectors: [
    validationCollectorObject(),
    validationCollectorArray(),
    validationCollectorString(),
    validationCollectorNumber(),
    validationCollectorBoolean(),
    validationCollectorDefault(),
  ],
  interpreters: {
    ...ALL_EXPRESSIONS,
    $schemaType: schemaTypeExpression(),
  },
  resolveSchema: resolveSchema.bind(null, {
    resolvers: [
      schemaResolverExpression(),
      schemaResolverObject(),
      schemaResolverArray(),
      schemaResolverDefault(),
    ],
  }),
}

const validate = validate_.bind(null, context)
const validateThrow = validateThrow_.bind(null, context)

const _validationTestLabel = (inputLabel, resultLabel) =>
  `validate(schema, ${inputLabel}) -> ${resultLabel}`

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
      },
    ],
    [
      ['9', '', 'Some string'],
      {
        string: null,
        number: MATCH_TYPE_ERROR,
        boolean: MATCH_TYPE_ERROR,
        object: MATCH_TYPE_ERROR,
        array: MATCH_TYPE_ERROR,
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
      },
    ],
    [
      [
        {
          /* empty object */
        },
        {},
      ],
      {
        string: MATCH_TYPE_ERROR,
        number: MATCH_TYPE_ERROR,
        boolean: MATCH_TYPE_ERROR,
        object: null,
        array: MATCH_TYPE_ERROR,
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
      },
    ],
    [
      [
        NaN,
        9n,
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
      },
    ],
  ]

  expectations.forEach(([inputs, resultByType]) => {
    inputs.forEach((input) => {
      Object.keys(resultByType).forEach((type) => {
        const result = resultByType[type]

        const inputLabel = _valueLabel(input)
        const resultLabel = _validationResultLabel(result)
        const testLabel = `validate required ${type}: ${inputLabel} -> ${resultLabel}`

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
          test(testLabel, () => expect(validate(schema, input)).toEqual(null))
        } else {
          // eslint-disable-next-line jest/valid-title
          test(testLabel, () =>
            expect(validate(schema, input)).toMatchObject(result)
          )
        }
      })
    })
  })
})

describe('enum -> ENUM_ERROR', () => {
  test('empty enum', () => {
    const schema = {
      type: 'string',
      enum: [],
    }
    expect(validate(schema, 'a')).toMatchObject([{ code: 'ENUM_ERROR' }])
    expect(validate(schema, 'b')).toMatchObject([{ code: 'ENUM_ERROR' }])
  })
  test('string options', () => {
    const schema = {
      type: 'string',
      enum: ['opt_a', 'opt_b', 'opt_c'],
    }
    expect(validate(schema, 'opt_a')).toEqual(null)
    expect(validate(schema, 'opt_b')).toEqual(null)
    expect(validate(schema, 'opt_c')).toEqual(null)
    expect(validate(schema, 'opt_d')).toMatchObject([{ code: 'ENUM_ERROR' }])
    expect(validate(schema, 1)).toMatchObject([{ code: 'TYPE_ERROR' }])
  })
  test('number options', () => {
    const schema = {
      type: 'number',
      enum: [1, 2, 3],
    }
    expect(validate(schema, 1)).toEqual(null)
    expect(validate(schema, 2)).toEqual(null)
    expect(validate(schema, 3)).toEqual(null)
    expect(validate(schema, 4)).toMatchObject([{ code: 'ENUM_ERROR' }])
    expect(validate(schema, '1')).toMatchObject([{ code: 'TYPE_ERROR' }])
  })
})

describe('string', () => {
  test('minLength -> STRING_MIN_LENGTH_ERROR', () => {
    const schema = {
      type: 'string',
      minLength: 5,
    }
    expect(validate(schema, '123')).toMatchObject([
      { code: 'STRING_MIN_LENGTH_ERROR' },
    ])
    expect(validate(schema, '12345')).toEqual(null)
    expect(validate(schema, '123456')).toEqual(null)
  })

  test('maxLength -> STRING_MAX_LENGTH_ERROR', () => {
    const schema = {
      type: 'string',
      maxLength: 5,
    }
    expect(validate(schema, '123')).toEqual(null)
    expect(validate(schema, '12345')).toEqual(null)
    expect(validate(schema, '123456')).toMatchObject([
      { code: 'STRING_MAX_LENGTH_ERROR' },
    ])
  })

  test('simultaneous', () => {
    const schema = {
      type: 'string',
      minLength: 5,
      maxLength: 10,
    }
    expect(validate(schema, '123')).toMatchObject([
      { code: 'STRING_MIN_LENGTH_ERROR' },
    ])
    expect(validate(schema, '12345')).toEqual(null)
    expect(validate(schema, '1234567')).toEqual(null)
    expect(validate(schema, '1234567890')).toEqual(null)
    expect(validate(schema, '12345678901')).toMatchObject([
      { code: 'STRING_MAX_LENGTH_ERROR' },
    ])
  })
})

describe('number', () => {
  test('min -> NUMBER_MIN_ERROR', () => {
    const schema = {
      type: 'number',
      min: 5,
    }
    expect(validate(schema, 4)).toMatchObject([{ code: 'NUMBER_MIN_ERROR' }])
    expect(validate(schema, 5)).toEqual(null)
    expect(validate(schema, 6)).toEqual(null)
  })
  test('minExclusive -> NUMBER_MIN_ERROR', () => {
    const schema = {
      type: 'number',
      minExclusive: 5,
    }
    expect(validate(schema, 4)).toMatchObject([{ code: 'NUMBER_MIN_ERROR' }])
    expect(validate(schema, 5)).toMatchObject([{ code: 'NUMBER_MIN_ERROR' }])
    expect(validate(schema, 6)).toEqual(null)
  })

  test('max -> NUMBER_MAX_ERROR', () => {
    const schema = {
      type: 'number',
      max: 5,
    }
    expect(validate(schema, 4)).toEqual(null)
    expect(validate(schema, 5)).toEqual(null)
    expect(validate(schema, 6)).toMatchObject([{ code: 'NUMBER_MAX_ERROR' }])
  })

  test('maxExclusive -> NUMBER_MAX_ERROR', () => {
    const schema = {
      type: 'number',
      maxExclusive: 5,
    }
    expect(validate(schema, 4)).toEqual(null)
    expect(validate(schema, 5)).toMatchObject([{ code: 'NUMBER_MAX_ERROR' }])
    expect(validate(schema, 6)).toMatchObject([{ code: 'NUMBER_MAX_ERROR' }])
  })

  test('multipleOf -> NUMBER_MULTIPLE_OF_ERROR', () => {
    const schema = {
      type: 'number',
      multipleOf: 5,
    }
    expect(validate(schema, 0)).toEqual(null)
    expect(validate(schema, 5)).toEqual(null)
    expect(validate(schema, 10)).toEqual(null)
    expect(validate(schema, 3)).toMatchObject([
      { code: 'NUMBER_MULTIPLE_OF_ERROR' },
    ])
  })

  test('simultaneous - 1', () => {
    const schema = {
      type: 'number',
      minExclusive: 5,
      max: 20,
      multipleOf: 5,
    }

    expect(validate(schema, 4)).toMatchObject([
      { code: 'NUMBER_MIN_ERROR' },
      { code: 'NUMBER_MULTIPLE_OF_ERROR' },
    ])
    expect(validate(schema, 5)).toMatchObject([{ code: 'NUMBER_MIN_ERROR' }])
    expect(validate(schema, 6)).toMatchObject([
      { code: 'NUMBER_MULTIPLE_OF_ERROR' },
    ])
    expect(validate(schema, 10)).toEqual(null)
    expect(validate(schema, 20)).toEqual(null)
    expect(validate(schema, 25)).toMatchObject([{ code: 'NUMBER_MAX_ERROR' }])
  })
})

describe('array', () => {
  test('minLength -> ARRAY_MIN_LENGTH_ERROR', () => {
    const schema = {
      type: 'array',
      minLength: 3,
    }

    expect(validate(schema, [])).toMatchObject([
      { code: 'ARRAY_MIN_LENGTH_ERROR' },
    ])
    expect(validate(schema, [0])).toMatchObject([
      { code: 'ARRAY_MIN_LENGTH_ERROR' },
    ])
    expect(validate(schema, [0, 1, 2])).toEqual(null)
    expect(validate(schema, [0, 1, 2, 3, 4, 5])).toEqual(null)
  })

  test('maxLength -> ARRAY_MAX_LENGTH_ERROR', () => {
    const schema = {
      type: 'array',
      maxLength: 3,
    }

    expect(validate(schema, [])).toEqual(null)
    expect(validate(schema, [0])).toEqual(null)
    expect(validate(schema, [0, 1, 2])).toEqual(null)
    expect(validate(schema, [0, 1, 2, 3, 4, 5])).toMatchObject([
      { code: 'ARRAY_MAX_LENGTH_ERROR' },
    ])
  })

  test('uniqueItems -> ARRAY_UNIQUE_ITEMS_ERROR', () => {
    const schema = {
      type: 'array',
      uniqueItems: true,
    }

    expect(validate(schema, [])).toEqual(null)
    expect(validate(schema, [0])).toEqual(null)
    expect(validate(schema, [0, 1, 2])).toEqual(null)
    expect(validate(schema, [0, 1, 2, 0])).toMatchObject([
      { code: 'ARRAY_UNIQUE_ITEMS_ERROR' },
    ])
    expect(validate(schema, [{}, {}])).toMatchObject([
      { code: 'ARRAY_UNIQUE_ITEMS_ERROR' },
    ])
    expect(
      validate(schema, [
        { key1: 'value1', key2: 'value2' },
        { key1: 'value1', key2: 'value2' },
      ])
    ).toMatchObject([{ code: 'ARRAY_UNIQUE_ITEMS_ERROR' }])

    expect(
      validate(schema, [
        { key1: 'value1', key2: 'value2' },
        { key1: 'ANOTHER_VALUE', key2: 'value2' },
      ])
    ).toEqual(null)
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

    const expectations = [
      [['12345', '1234567', '1234567890'], null],
      [
        ['1234', '123', '12345', '12345678901'],
        [
          { path: '0', code: 'STRING_MIN_LENGTH_ERROR' },
          { path: '1', code: 'STRING_MIN_LENGTH_ERROR' },
          { path: '3', code: 'STRING_MAX_LENGTH_ERROR' },
        ],
      ],
      [
        [1, '12345', '123'],
        [
          { path: '0', code: 'TYPE_ERROR' },
          { path: '2', code: 'STRING_MIN_LENGTH_ERROR' },
        ],
      ],
    ]

    _generateTests(
      expectations,
      (input) => validate(schema, input),
      _validationTestLabel
    )
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

    const expectations = [
      [null, null],
      [[], null],
      [
        [
          { strRequired: 'some string', strMinLen5: '12345' },
          { strRequired: 'another string', strMinLen5: '123456' },
        ],
        null,
      ],
      [
        [{ strMinLen5: '12345' }, { strMinLen5: '1234' }],
        [
          { code: 'REQUIRED_ERROR', path: '0.strRequired' },
          { code: 'REQUIRED_ERROR', path: '1.strRequired' },
          { code: 'STRING_MIN_LENGTH_ERROR', path: '1.strMinLen5' },
        ],
      ],
    ]

    _generateTests(
      expectations,
      (input) => validate(schema, input),
      _validationTestLabel
    )
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

    const expectations = [
      [
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
    ]

    _generateTests(
      expectations,
      (input) => validate(schema, input),
      _validationTestLabel
    )
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

    const expectations = [
      [
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
    ]

    _generateTests(
      expectations,
      (input) => validate(schema, input),
      _validationTestLabel
    )
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

    const expectations = [
      [
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
    ]

    _generateTests(
      expectations,
      (input) => validate(schema, input),
      _validationTestLabel
    )
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

    const expectations = [
      [null, [{ path: 'strRequired', code: 'REQUIRED_ERROR' }]],
      [{}, [{ path: 'strRequired', code: 'REQUIRED_ERROR' }]],
      [{ strRequired: 'some string' }, null],
      [
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
        {
          strRequired: 'some string',
          strMinLen5: '12345',
          numMin5: 5,
          arrayMinLen1: ['1'],
        },
        null,
      ],
    ]

    _generateTests(
      expectations,
      (input) => validate(schema, input),
      _validationTestLabel
    )
  })

  test('properties: if given any unknown property, should fail validation', () => {
    expect(
      validate(objSchema1, {
        strRequired: 'some string',
        strMinLen5: '12345',
        numMin5: 5,
        arrayMinLen1: ['1'],
        unknownProp: 'UNKNOWN_VALUE',
      })
    ).toMatchObject([{ code: 'OBJECT_UNKNOWN_PROPERTIES_ERROR', path: '' }])
  })

  describe('properties: nested errors - object -> object -> value', () => {
    const schema = objSchema2

    const expectations = [
      [
        null,
        [
          { path: 'objSchema1.strRequired', code: 'REQUIRED_ERROR' },
          { path: 'strRequired', code: 'REQUIRED_ERROR' },
        ],
      ],
    ]

    _generateTests(
      expectations,
      (input) => validate(schema, input),
      _validationTestLabel
    )
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

    const expectations = [
      [
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
    ]

    _generateTests(
      expectations,
      (input) => validate(schema, input),
      _validationTestLabel
    )
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

    const expectations = [
      [{ minLength: 5, maxLength: 10, value: '12345678' }, null],
      [
        { minLength: 5, maxLength: 10, value: '123' },
        [{ code: 'CUSTOM_MIN_LENGTH_ERROR', path: '' }],
      ],
      [{ minLength: 3, maxLength: 10, value: '123' }, null],
      [
        { minLength: 3, maxLength: 10, value: '12345678901' },
        [{ code: 'CUSTOM_MAX_LENGTH_ERROR', path: '' }],
      ],
    ]

    _generateTests(
      expectations,
      (input) => validate(schema, input),
      _validationTestLabel
    )
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

    const expectations = [
      [
        {
          givenName: 'João',
          familyName: 'Silva',
          role: 'driver',
          age: 20,
        },
        null,
      ],
      [
        {
          givenName: 'João',
          familyName: 'Silva',
          role: 'driver',
          age: 17,
        },
        [{ code: 'DRIVER_MIN_AGE_18', path: 'age' }],
      ],
      [
        {
          role: 'driver',
          age: 17,
        },
        [
          { code: 'DRIVER_MIN_AGE_18', path: 'age' },
          { code: 'REQUIRED_ERROR', path: 'givenName' },
        ],
      ],
    ]

    _generateTests(
      expectations,
      (input) => validate(schema, input),
      _validationTestLabel
    )
  })
})

test('validateThrow', () => {
  const schema = {
    type: 'string',
    minLength: 5,
  }

  expect(validateThrow(schema, '12345')).toEqual(undefined)
  expect(() => validateThrow(schema, '1234')).toThrow(ValidationError)
})
