import { resolveSchema } from './resolveSchema'

describe('resolveSchema', () => {
	test('', () => {
    const schema = {
      type: 'map',
      properties: {
        key1: {
          type: 'string',
          options: [
            'A',
            'B'
          ]
        },
        key2: {
          type: 'string',
          options: [
            '$switchKey', {
              'A': ['A-1', 'A-2', 'A-3', ['$value', 'key1']],
              'B': ['B-1', 'B-2']
            }, [], ['$value', 'key1']
          ]
        },
        key3: ['$switchKey', {
          'A-1': {
            type: 'string',
            options: ['A-1-1', 'A-1-2']
          },
          'A-2': {
            type: 'string',
            options: ['A-2-1', 'A-2-2', 'A-2-3']
          },
          'A-3': {
            type: 'string',
            options: ['A-3-1', 'A-3-2', 'A-3-3', 'A-3-4']
          }
        }, { type: 'string', disabled: true }, ['$value', 'key2']]
      }
    }


    console.time('resolveSchema')
    const resolvedSchema = resolveSchema({

    }, schema, {
      key1: 'A',
      key2: 'A-1'
    })

    console.timeEnd('resolveSchema')

    console.log(JSON.stringify(resolvedSchema, null, '  '))
	})
})
