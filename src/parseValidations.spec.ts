import {
  allowValues,
  parallelCases
} from '@orioro/validate'

import {
  parseValidations,
  mapValidationResolver,
  defaultValidationResolver
} from './parseValidations'

describe.skip('parseValidations', () => {

  const TYPE_STR_COND = ['$eq', 'string', ['$type']]
  const TYPE_STR_ERR = {
    code: 'TYPE_ERROR',
    message: 'Must be type string'
  }

  test('required immediate schema', () => {
    const schema = {
      type: 'string',
      required: {
        error: TYPE_STR_ERR
      }
    }

    const validations = parseValidations(schema, {
      resolvers: [
        mapValidationResolver(),
        defaultValidationResolver()
      ],
      path: '',
    })

    expect(validations).toEqual([
      {
        path: '',
        validation: ['$if', TYPE_STR_COND, null, TYPE_STR_ERR]
      }
    ])
  })

  test('optional immediate schema', () => {
    const schema = {
      type: 'string'
    }

    const validations = parseValidations(schema, {
      resolvers: [
        mapValidationResolver(),
        defaultValidationResolver()
      ],
      path: '',
    })

    expect(validations).toEqual([
      {
        path: '',
        validation: allowValues(
          [null, undefined],
          ['$if', TYPE_STR_COND, null, TYPE_STR_ERR]
        )
      }
    ])

    // expect(validations).toEqual([
    //   {
    //     path: '',
    //     validation: [
    //       ['$gte', 5, ['$stringLength']],
    //       'It must contain at least 5 characters',
    //     ],
    //   }
    // ])
  })

	// test('map schema', () => {
 //    const schema = {
 //      type: 'map',
 //      properties: {
 //        key0: {
 //          type: 'string',
 //          required: 'key0 is required and must be of type string',
 //          validations: [
 //            [
 //              ['$gte', 1, ['$stringLength']],
 //              'It must contain at least 1 character',
 //            ],
 //            [
 //              ['$lte', 10, ['$stringLength']],
 //              'It must contain at most 10 characters',
 //            ]
 //          ]
 //        }
 //      }
 //    }
 //    const validations = parseValidations(schema, {
 //      resolvers: [
 //        mapValidationResolver(),
 //        defaultValidationResolver()
 //      ],
 //      path: '',
 //    })

 //    // console.log(validations)

 //    expect(validations).toEqual([
 //      {
 //        path: '.key0',
 //        validation: [
 //          ['$eq', 'string', ['$type']],
 //          'key0 is required and must be of type string'
 //        ]
 //      },
 //      {
 //        path: '.key0',
 //        validation: [
 //          ['$gte', 1, ['$stringLength']],
 //          'It must contain at least 1 character',
 //        ],
 //      },
 //      {
 //        path: '.key0',
 //        validation: [
 //          ['$lte', 10, ['$stringLength']],
 //          'It must contain at most 10 characters',
 //        ]
 //      }
 //    ])
	// })
})
