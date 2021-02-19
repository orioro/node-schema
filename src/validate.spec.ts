import { validate } from './validate'

import {
  _valueLabel,
  _validationResultLabel,
  _generateTests,
} from '../test/util/generateTests'

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
        { k1: 1, k2: '2' },
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

        if (result === null) {
          // eslint-disable-next-line jest/valid-title
          test(testLabel, () =>
            expect(
              validate(
                {
                  type,
                  required: true,
                },
                input
              )
            ).toEqual(null)
          )
        } else {
          // eslint-disable-next-line jest/valid-title
          test(testLabel, () =>
            expect(
              validate(
                {
                  type,
                  required: true,
                },
                input
              )
            ).toMatchObject(result)
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

    /**
     * @todo validate This test will probably fail when we introduce the resolution step inside
     *                validate method.
     */
    expect(
      validate(schema, [
        { key1: 'value1', key2: 'value2' },
        { key1: 'ANOTHER_VALUE', key2: 'value2' },
      ])
    ).toEqual(null)
  })

  // eslint-disable-next-line jest/no-disabled-tests
  describe.skip('items: immediately nested item validation', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const schema = { type: 'array' }
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

  // const objSchema3 = {
  //   type: 'object',
  //   properties: {
  //     objSchema1,
  //     objSchema2,
  //   },
  // }

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

    _generateTests(expectations, (input) => validate(schema, input))
  })

  describe('properties -> properties: deep nested properties errors', () => {
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

    _generateTests(expectations, (input) => validate(schema, input))
  })

  // eslint-disable-next-line jest/no-disabled-tests, @typescript-eslint/no-empty-function
  describe.skip('properties -> array.items -> properties: deep nested array item properties errors', () => {})
})

////////////////////////////////////
// To be incorporated or removed: //
////////////////////////////////////

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('type: object', () => {
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
        'DRIVER_MIN_AGE_18',
      ],
    ],
  }

  test('no error', () => {
    expect(
      validate(schema, {
        givenName: 'João',
        familyName: 'Moreira',
        role: 'driver',
        age: 20,
      })
    ).toEqual(null)
  })

  test('REQUIRED_ERROR', () => {
    expect(validate(schema, {})).toMatchObject([
      {
        code: 'REQUIRED_ERROR',
        path: 'givenName',
        value: undefined,
      },
      {
        code: 'REQUIRED_ERROR',
        path: 'role',
        value: undefined,
      },
      {
        code: 'REQUIRED_ERROR',
        path: 'age',
        value: undefined,
      },
    ])
  })

  test('conditional error w/ required error (errors in multiple levels)', () => {
    const value = {
      familyName: 'Moreira',
      role: 'driver',
      age: 15,
    }

    expect(validate(schema, value)).toMatchObject([
      {
        code: 'DRIVER_MIN_AGE_18',
        path: '',
        value,
      },
      {
        code: 'REQUIRED_ERROR',
        path: 'givenName',
        value: undefined,
      },
    ])
  })
})

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('type: array - 1', () => {
  const schema = {
    type: 'array',
    itemSchema: {
      type: 'string',
      required: true,
      minLength: 5,
      maxLength: 10,
    },
  }

  test('basic', () => {
    const value = ['123', '12345678', undefined, null, '12345678901234567890']

    const result = validate(schema, value, {
      getType: (value) => {
        return Array.isArray(value) ? 'array' : undefined
      },
    })

    expect(result).toMatchObject([
      {
        code: 'STRING_MIN_LENGTH_ERROR',
        path: '0',
        value: '123',
      },
      {
        code: 'REQUIRED_ERROR',
        path: '2',
        value: undefined,
      },
      {
        code: 'REQUIRED_ERROR',
        path: '3',
        value: null,
      },
      {
        code: 'STRING_MAX_LENGTH_ERROR',
        path: '4',
        value: '12345678901234567890',
      },
    ])
  })
})
