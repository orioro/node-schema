import {
  parseValidations,
  mapValidationResolver,
  defaultValidationResolver
} from './parseValidations'

describe('parseValidations', () => {
	test('', () => {
    const schema = {
      type: 'map',
      properties: {
        key0: {
          type: 'string',
          required: 'This string is required',
          validations: [
            [
              ['$gte', 1, ['$stringLength']],
              'It must contain at least 1 character',
            ],
            [
              ['$lte', 10, ['$stringLength']],
              'It must contain at most 10 characters',
            ]
          ]
        },
        key1: {
          type: 'number',
          validations: [
            '$if',
            [/* null */],
            [
              ['$eq', 'number', ['$type']],
              'Invalid type'
            ]
          ]
        },
        key2: {
          type: 'map',
          properties: {
            key20: {
              type: 'string',
              validations: [
                [
                  'condition200',
                  'Message 200'
                ],
                [
                  'condition201',
                  'Message 201'
                ]
              ]
            }
          }
        }
      }
    }
    const validations = parseValidations(schema, {
      resolvers: [
        mapValidationResolver(),
        defaultValidationResolver()
      ],
      path: '',
    })

    console.log(validations)
	})
})
