import {
  resolveValue as resolveValue_,
  objectValueResolver,
  arrayValueResolver,
  // numberValueResolver,
  // stringValueResolver,
  // booleanValueResolver,
  defaultValueResolver,
} from './resolveValue'

const resolveValue = resolveValue_.bind(null, {
  resolvers: [
    objectValueResolver(),
    arrayValueResolver(),
    // numberValueResolver(),
    // stringValueResolver(),
    // booleanValueResolver(),
    defaultValueResolver(),
  ],
})

describe('type casting', () => {
  const expectations: [any, { [key: string]: any }][] = [
    [
      undefined,
      {
        string: null,
        number: null,
        boolean: null,
        object: null,
        array: null,
        // date: null,
      },
    ],
    [
      null,
      {
        string: null,
        number: null,
        boolean: null,
        object: null,
        array: null,
        // date: null,
      },
    ],
    [
      9,
      {
        string: 9,
        number: 9,
        boolean: 9,
        object: 9,
        array: 9,
        // date: null,
      },
    ],
    [
      NaN,
      {
        string: NaN,
        number: NaN,
        boolean: NaN,
        object: NaN,
        array: NaN,
        // date: null,
      },
    ],
    [
      '9',
      {
        string: '9',
        number: '9',
        boolean: '9',
        object: '9',
        array: '9',
        // date: null,
      },
    ],
    [
      '9.9',
      {
        string: '9.9',
        number: '9.9',
        boolean: '9.9',
        object: '9.9',
        array: '9.9',
        // date: null,
      },
    ],
    [
      '',
      {
        string: '',
        number: '',
        boolean: '',
        object: '',
        array: '',
        // date: null,
      },
    ],
    [
      true,
      {
        string: true,
        number: true,
        boolean: true,
        object: true,
        array: true,
        // date: null,
      },
    ],
    [
      false,
      {
        string: false,
        number: false,
        boolean: false,
        object: false,
        array: false,
        // date: null,
      },
    ],
    [
      // For objects, all schema types other than 'object'
      // will simply return the original value
      // These should generate errors on validation step
      { key1: 'value1' },
      {
        string: { key1: 'value1' },
        number: { key1: 'value1' },
        boolean: { key1: 'value1' },
        object: {},
        array: { key1: 'value1' },
        // date: null,
      },
    ],
    [
      // For arrays, all schema types other than 'array'
      // will simply return the original value.
      // These should generate errors on validation step
      ['1', '2', '3'],
      {
        string: ['1', '2', '3'],
        number: ['1', '2', '3'],
        boolean: ['1', '2', '3'],
        object: ['1', '2', '3'],
        array: [null, null, null],
        // date: null,
      },
    ],
    [
      true,
      {
        string: true,
        number: true,
        boolean: true,
        object: true,
        array: true,
        // date: null,
      },
    ],
    [
      false,
      {
        string: false,
        number: false,
        boolean: false,
        object: false,
        array: false,
        // date: null,
      },
    ],
  ]

  expectations.forEach(([input, resultByType]) => {
    Object.keys(resultByType).forEach((type) => {
      const inputLabel =
        typeof input === 'string'
          ? `'${input}'`
          : typeof input === 'object'
          ? Object.prototype.toString.call(input)
          : String(input)

      test(`${type}(${inputLabel}) -> ${resultByType[type]}`, () => {
        expect(resolveValue({ type }, input)).toEqual(resultByType[type])
      })
    })
  })
})

describe('array', () => {
  test('w/ object items', () => {
    const schema = {
      type: 'array',
      items: {
        type: 'string',
      },
    }

    const expectations = [
      [undefined, null],
      [
        ['1', '2', '3'],
        ['1', '2', '3'],
      ],
      [
        [1, undefined, '3'],
        [1, null, '3'],
      ],
    ]

    expectations.forEach(([input, result]) => {
      expect(resolveValue(schema, input)).toEqual(result)
    })
  })

  test('w/ tuple items', () => {
    const schema = {
      type: 'array',
      items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
    }

    const expectations = [
      [
        ['1', 2, true],
        ['1', 2, true],
      ],
      [
        ['1', '2', '3'],
        ['1', '2', '3'],
      ],
      [
        [undefined, undefined, undefined],
        [null, null, null],
      ],
    ]

    expectations.forEach(([input, result]) => {
      expect(resolveValue(schema, input)).toEqual(result)
    })
  })

  describe('default', () => {
    test('w/ object items', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'string',
          default: 'DEFAULT_VALUE',
        },
      }

      expect(resolveValue(schema, undefined)).toEqual(null)
      expect(
        resolveValue(schema, [undefined, undefined, 'some value'])
      ).toEqual(['DEFAULT_VALUE', 'DEFAULT_VALUE', 'some value'])
      expect(
        resolveValue(
          {
            ...schema,
            default: [undefined],
          },
          undefined
        )
      ).toEqual(['DEFAULT_VALUE'])
    })

    test('w/ tuple items', () => {
      const schema = {
        type: 'array',
        items: [
          { type: 'string', default: 'DEFAULT_VALUE' },
          { type: 'number', default: 10 },
          { type: 'boolean', default: true },
        ],
      }

      const expectations = [
        [
          ['1', 2, true],
          ['1', 2, true],
        ],
        [
          ['1', '2', '3'],
          ['1', '2', '3'],
        ],
        [
          [undefined, undefined, undefined],
          ['DEFAULT_VALUE', 10, true],
        ],
        [
          [undefined, 4, undefined],
          ['DEFAULT_VALUE', 4, true],
        ],
      ]

      expectations.forEach(([input, result]) => {
        expect(resolveValue(schema, input)).toEqual(result)
      })
    })
  })
})

describe('object', () => {
  test('only known properties are picked', () => {
    const schema = {
      type: 'object',
      properties: {
        key1: { type: 'string' },
        key2: { type: 'number' },
      },
    }

    const expectations = [
      [undefined, null],
      [
        {
          key1: 'some string',
          key2: 10,
          key3: 'some other value',
        },
        {
          key1: 'some string',
          key2: 10,
          // key3: 'some other value' // this key is ignored
        },
      ],
    ]

    expectations.forEach(([input, result]) => {
      expect(resolveValue(schema, input)).toEqual(result)
    })
  })

  test('complex object', () => {
    const schema = {
      type: 'object',
      properties: {
        key1: {
          type: 'string',
          // default: 'key1_default',
        },
        key2: {
          type: 'string',
          default: 'key2_default',
        },
        key3: {
          type: 'string',
          default: 'key3_default',
        },
        key4: {
          type: 'object',
          properties: {
            key41: {
              type: 'number',
            },
            key42: {
              type: 'number',
              default: 999,
            },
            key43: {
              type: 'string',
              default: 'key43_default',
            },
          },
        },
        key5: {
          type: 'array',
          default: [undefined],
          items: {
            type: 'string',
            default: 'key5_item',
          },
        },
      },
    }

    const expectations = [
      [undefined, null],
      [
        {},
        {
          key1: null,
          key2: 'key2_default',
          key3: 'key3_default',
          key4: null,
          key5: ['key5_item'],
        },
      ],
      [
        { key4: {} },
        {
          key1: null,
          key2: 'key2_default',
          key3: 'key3_default',
          key4: {
            key41: null,
            key42: 999,
            key43: 'key43_default',
          },
          key5: ['key5_item'],
        },
      ],
    ]

    expectations.forEach(([input, result]) => {
      expect(resolveValue(schema, input)).toEqual(result)
    })
  })

  describe('default', () => {
    test('basic', () => {
      const schema = {
        type: 'object',
        properties: {
          key1: {
            type: 'string',
            default: 'DEFAULT_VALUE',
          },
          key2: {
            type: 'number',
            default: 10,
          },
        },
      }

      expect(resolveValue(schema, undefined)).toEqual(null)
      expect(
        resolveValue(
          {
            ...schema,
            default: {},
          },
          undefined
        )
      ).toEqual({
        key1: 'DEFAULT_VALUE',
        key2: 10,
      })
      expect(resolveValue(schema, {})).toEqual({
        key1: 'DEFAULT_VALUE',
        key2: 10,
      })
      expect(resolveValue(schema, { key2: 8 })).toEqual({
        key1: 'DEFAULT_VALUE',
        key2: 8,
      })
    })
  })
})
