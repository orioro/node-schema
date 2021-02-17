import { resolveValue } from './resolveValue'

test('string', () => {
  const schema = { type: 'string' }

  const expectations = [
    [undefined, null],
    [9, '9'],
    [null, null],
    [{ key1: 'value1' }, null],
    [['v1', 'v2'], null],
    [true, 'true'],
    [false, 'false'],
  ]

  expectations.forEach(([input, result]) => {
    expect(resolveValue(schema, { value: input })).toEqual(result)
  })
})

test('number', () => {
  const schema = { type: 'number' }

  const expectations = [
    [undefined, null],
    [null, null],
    [9, 9],
    ['9', 9],
    ['09', 9],
    ['90', 90],
    ['9.9', 9.9],
    [true, null],
    [false, null]
  ]

  expectations.forEach(([input, result]) => {
    expect(resolveValue(schema, { value: input })).toEqual(result)
  })
})

test('boolean', () => {
  const schema = { type: 'boolean' }

  const expectations = [
    [undefined, null],
    [null, null],
    [9, true],
    [0, false],
    ['', false],
    ['0', true],
    [[], true],
    [{}, true],
    [false, false]
  ]

  expectations.forEach(([input, result]) => {
    expect(resolveValue(schema, { value: input })).toEqual(result)
  })
})

describe('array', () => {
  test('basic', () => {
    const schema = { type: 'array' }

    const expectations = [
      [undefined, []],
      [null, null],
      [9, null],
      [0, null],
      ['', null],
      ['0', null],
      [[], []],
      [['1', '2', '3'], [undefined, undefined, undefined]],
      [{}, null],
      [false, null],
      [true, null]
    ]

    expectations.forEach(([input, result]) => {
      expect(resolveValue(schema, { value: input })).toEqual(result)
    })
  })

  test('w/ itemSchema', () => {
    const schema = {
      type: 'array',
      itemSchema: {
        type: 'string'
      }
    }

    const expectations = [
      [undefined, []],
      [['1', '2', '3'], ['1', '2', '3']],
      [[1, undefined, '3'], ['1', null, '3']],
    ]

    expectations.forEach(([input, result]) => {
      expect(resolveValue(schema, { value: input })).toEqual(result)
    })
  })

  /**
   * @todo resolveValue convert `itemSchema` to `items`
   */
  test.skip('w/ tuple itemSchema', () => {})
})

describe('object', () => {
  test('basic', () => {
    const schema = { type: 'object' }

    const expectations = [
      [undefined, {}],
      [null, null],
      [9, null],
      [0, null],
      ['', null],
      ['0', null],
      [[], null],
      [{}, {}],
      [false, null],
      [true, null]
    ]

    expectations.forEach(([input, result]) => {
      expect(resolveValue(schema, { value: input })).toEqual(result)
    })
  })

  test('only known properties are picked', () => {
    const schema = {
      type: 'object',
      properties: {
        key1: { type: 'string' },
        key2: { type: 'number' }
      }
    }

    const expectations = [
      [undefined, {
        key1: null,
        key2: null
      }],
      [
        {
          key1: 'some string',
          key2: 10,
          key3: 'some other value'
        },
        {
          key1: 'some string',
          key2: 10,
          // key3: 'some other value'
        }
      ]
    ]

    expectations.forEach(([input, result]) => {
      expect(resolveValue(schema, { value: input })).toEqual(result)
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
              type: 'number'
            },
            key42: {
              type: 'number',
              default: 999,
            },
            key43: {
              type: 'string',
              default: 'key43_default',
            },
          }
        },
        key5: {
          type: 'array',
          default: [undefined],
          itemSchema: {
            type: 'string',
            default: 'key5_item'
          }
        }
      }
    }
    
    const value = resolveValue(schema, {
      value: undefined
    })

    expect(value).toEqual({
      key1: null,
      key2: 'key2_default',
      key3: 'key3_default',
      key4: {
        key41: null,
        key42: 999,
        key43: 'key43_default'
      },
      key5: ['key5_item']
    })
  })
})
