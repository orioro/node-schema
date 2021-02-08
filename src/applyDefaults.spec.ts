import { applyDefaults } from './applyDefaults'

describe('applyDefaults', () => {
	test('', () => {
    const schema = {
      type: 'map',
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
          type: 'map',
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
          type: 'list',
          default: [undefined],
          itemSchema: {
            type: 'string',
            default: 'key5_item'
          }
        }
      }
    }
    const value = applyDefaults(schema, {
      value: undefined
    })

    expect(value).toEqual({
      key1: '',
      key2: 'key2_default',
      key3: 'key3_default',
      key4: {
        key41: 0,
        key42: 999,
        key43: 'key43_default'
      },
      key5: ['key5_item']
    })
	})
})
