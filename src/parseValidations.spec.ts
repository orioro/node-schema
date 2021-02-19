import {
  allowValues,
  prohibitValues,
  parallelCases,
  validate
} from '@orioro/validate'

import { schemaTypeExpression } from './expressions'

import {
  ALL_EXPRESSIONS
} from '@orioro/expression'

import {
  parseValidations,
  mapValidationResolver,
  listValidationResolver,
  defaultValidationResolver,
  stringValidationResolver,
} from './parseValidations'

const dump = value => console.log(JSON.stringify(value, null, '  '))

const REQUIRED_ERROR = {
  code: 'REQUIRED_ERROR',
  message: 'This value is required'
}

const TYPE_ERROR = {
  code: 'TYPE_ERROR',
  message: 'Invalid type'
}

const interpreters = {
  ...ALL_EXPRESSIONS,
  $schemaType: schemaTypeExpression(),
}

describe('parseValidations(schema, context) - required / optional', () => {
  test('required', () => {

    const schema = {
      type: 'string',
      required: true,
      errors: {
        required: REQUIRED_ERROR,
        type: TYPE_ERROR
      }
    }

    const validations = parseValidations(schema, undefined, {
      resolvers: [
        mapValidationResolver(),
        defaultValidationResolver()
      ]
    })

    expect(validations).toEqual([
      {
        path: '',
        validation: prohibitValues(
          [null, undefined],
          REQUIRED_ERROR,
          [
            '$if',
            ['$notEq', 'string', ['$schemaType']],
            TYPE_ERROR,
            null
          ]
        )
      }
    ])

    const expectations = [
      [null, [REQUIRED_ERROR]],
      [undefined, [REQUIRED_ERROR]],
      [9, [TYPE_ERROR]],
      ['some text', null]
    ]

    expectations.forEach(([input, expected]) => {
      expect(validate(validations[0].validation, input, { interpreters }))
        .toEqual(expected)
    })
  })

  test('optional', () => {
    const schema = {
      type: 'string',
      errors: {
        type: TYPE_ERROR
      }
    }

    const validations = parseValidations(schema, undefined, {
      resolvers: [
        mapValidationResolver(),
        defaultValidationResolver()
      ]
    })

    expect(validations).toMatchObject([
      {
        path: '',
        validation: allowValues(
          [null, undefined],
          [
            '$if',
            ['$notEq', 'string', ['$schemaType']],
            { code: 'TYPE_ERROR' },
            null
          ]
        )
      }
    ])

    const expectations = [
      [null, null],
      [undefined, null],
      [9, [TYPE_ERROR]],
      ['some text', null]
    ]

    expectations.forEach(([input, expected]) => {
      expect(validate(validations[0].validation, input, { interpreters }))
        .toEqual(expected)
    })
  })

})

test('string validations', () => {
  const MIN_LENGTH_ERROR = {
    code: 'MIN_LENGTH_ERROR',
    message: 'Text must have at least 1 char'
  }

  const MAX_LENGTH_ERROR = {
    code: 'MAX_LENGTH_ERROR',
    message: 'Text must have at most 10 chars'
  }

  const PATTERN_ERROR = {
    code: 'PATTERN_ERROR',
    message: 'Text must match pattern'
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
      pattern: PATTERN_ERROR
    }
  }

  const validations = parseValidations(schema, 'Some text', {
    resolvers: [
      stringValidationResolver(),
      defaultValidationResolver()
    ]
  })

  expect(validations).toEqual([
    {
      path: '',
      validation: prohibitValues(
        [null, undefined],
        REQUIRED_ERROR,
        [
          '$if',
          ['$notEq', 'string', ['$schemaType']],
          TYPE_ERROR,
          parallelCases([
            [
              ['$gte', 5, ['$stringLength']],
              MIN_LENGTH_ERROR
            ],
            [
              ['$lte', 10, ['$stringLength']],
              MAX_LENGTH_ERROR
            ],
            [
              ['$stringTest', ['^a.+z$', 'i']],
              PATTERN_ERROR
            ]
          ])
        ]
      )
    }
  ])

  const expectations = [
    [null, [REQUIRED_ERROR]],
    [undefined, [REQUIRED_ERROR]],
    [9, [TYPE_ERROR]],
    ['a', [MIN_LENGTH_ERROR, PATTERN_ERROR]],
    ['abcdefghijklmnopqrstuv', [MAX_LENGTH_ERROR, PATTERN_ERROR]],
    ['bcdefghi', [PATTERN_ERROR]],
    ['abcdez', null],
    ['AbcdeZ', null],
  ]

  expectations.forEach(([input, expected]) => {
    expect(validate(validations[0].validation, input, { interpreters }))
      .toEqual(expected)
  })
})

describe('list validations', () => {
  const MIN_LENGTH_ERROR = {
    code: 'MIN_LENGTH_ERROR'
  }

  const MAX_LENGTH_ERROR = {
    code: 'MAX_LENGTH_ERROR'
  }

  const schema = {
    type: 'list',
    itemSchema: {
      type: 'string',
      required: true,
      minLength: 5,
      maxLength: 10,
      errors: {
        required: REQUIRED_ERROR,
        type: TYPE_ERROR,
        minLength: MIN_LENGTH_ERROR,
        maxLength: MAX_LENGTH_ERROR
      }
    }
  }

  test('', () => {
    const validations = parseValidations(schema, ['123', '12345', '1234567', '123456789012345'], {
      resolvers: [
        listValidationResolver(),
        stringValidationResolver(),
        defaultValidationResolver()
      ]
    })

    expect(validations).toMatchSnapshot()
  })
})
