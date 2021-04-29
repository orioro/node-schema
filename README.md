# schema

```
npm install @orioro/schema
yarn add @orioro/schema
```

Define complex data schemas and validation steps. Supports:
- Conditional validation
- Customizable validation criteria

# Steps:

- Value resolution:
  - Resolve schema
  - Resolve value
- Value validation
  - Resolve schema
  - Resolve value
  - Resolve schema against resolved value
  - Validate

## Schema environment definition (`environment(options: EnvironmentOptions)`)

Schema module is extremely extensible to allow for definition of custom types, custom keywords
in schema body, etc.

Most customizations are defined through `resolvers` for each of the steps (schema resolution, 
value resolution, validation resolution, validation) and `expression interpreters`.

## Schema resolution (`resolveSchema(rawSchema, rawValue)`)

Schemas may define conditional declarations at any level/position, which should be resolved
before any other operation. Otherwise, conditional logic statements will not be interpreted
correctly by value resolution or value validation methods (`resolveValue` and `validate` respectively).

The schema resolution algorithm traverses the schema tree looking for expressions, such as
`['$if', {CONDIITON}, {THENVALUE}, {ELSEVALUE}]` and evaluates all of them using the provided
`value` as context. If the value returned by the evaluation of those expressions is an
`Object` or an `Array`, they are recursively traversed by `resolveSchema`, looking for nested
expressions, with 2 exceptions:
- `items` property (see Array item validation)
- `validations` property (see validation)

## Value resolution (`resolveValue(resolvedSchema, rawValue)`)

User input (both end-user and the programmer library user) may be faulty or not conform to
specs. For example:
- value is expected to be either a `string` or `null`, but the raw input may come as
  `undefined`.
- if an object's property value is not given (it is `undefined`), it should default to some
  value that is derived from the value of other properties

The value resolution step applies those rules by traversing the resolved schema and checking
the values at corresponding paths. Values that are not defined in the schema are removed
from the retuned resolvedValue. Custom value resolvers may be defined at schema environment
definition through the option `valueResolvers`.

## Value validation (`validate(resolvedSchema, rawOrResolvedValue, valueIsResolved = false)`)

The value validation step works with 2 inner steps:
1. Parse schema validations: traverse the schema tree and collect validations for each path
2. Execute validations against the value

Validation function comes in two fashions:
- `validate`: returns either `null` (if no errors are found) or an array of error
  specifications
- `validateThrow`: if any error is found, throws a ValidationError; otherwise simply returns
  `undefined`

# Design decisions

## Should `validation` property be an array of validation cases or an expression by itself? Or both?

For now, we've decided to go with the array of validation cases only. That simplifies logic
and possibly attends most of the scenarios.

## Should `type` be allowed to hold a list of types?

Two distinct types more often than not, use different validation algorithms, which
would leave the multi-type option useful only for the scenario of easily declaring
a value that can be any of two types without any extra validation.

## Merging min with minExclusive and max with maxExclusive

Were merged so that the error returned by both the threshould and its exclusive variant
return the same error code and message.

## Double resolution step

## Array item validation: items vs itemSchema

`items` allows for expressing both a tuple validation and an itemSchema validation.
`itemSchema` would be a bit awkward name to allow for tuple validation, though more
explicit on the itemSchema validation side.

## No defaults for resolveSchema, resolveValue and validate

The functions are exported but they are not the main interface of the module.
Their configurations should be either explicitly set or provided by a wrapper function
such as the exported `environment` function. That is to enforce shared configurations,
for example: expression interpreters can be shared throughout all steps and it would be
a strange behavior if one expression was available in one step but unavailable on the other.
On the other hand, exactly that case might be useful in some more complex situations (e.g. when some expression should be available on schemaResolution step but not on the validation step), but they should be explicitly declared.

## No 'autoresolution' - require that both schema and value provided be explicitly resolved/unresolved

For validate: if validate method "auto resolves" the received value, it would validate a value that is different from its input, thus it must validate exactly against its raw input

# API Docs

- [`validationCollectorObject()`](#validationcollectorobject)
- [`validationCollectorArray()`](#validationcollectorarray)
- [`validationCollectorString()`](#validationcollectorstring)
- [`validationCollectorNumber()`](#validationcollectornumber)
- [`validationCollectorBoolean()`](#validationcollectorboolean)
- [`validationCollectorDefault()`](#validationcollectordefault)
- [`collectValidations()`](#collectvalidations)
- [`schemaTypeExpression()`](#schematypeexpression)
- [`ENUM`](#enum)
- [`STRING_MIN_LENGTH`](#string_min_length)
- [`STRING_MAX_LENGTH`](#string_max_length)
- [`NUMBER_MIN`](#number_min)
- [`NUMBER_MAX`](#number_max)
- [`NUMBER_MULTIPLE_OF`](#number_multiple_of)
- [`ARRAY_MIN_LENGTH`](#array_min_length)
- [`ARRAY_MAX_LENGTH`](#array_max_length)
- [`ARRAY_EXACT_LENGTH`](#array_exact_length)
- [`ARRAY_UNIQUE_ITEMS`](#array_unique_items)
- [`OBJECT_UNKNOWN_PROPERTIES`](#object_unknown_properties)
- [`parseValidationCases()`](#parsevalidationcases)
- [`schemaResolverFunction()`](#schemaresolverfunction)
- [`schemaResolverExpression()`](#schemaresolverexpression)
- [`schemaResolverObject()`](#schemaresolverobject)
- [`schemaResolverArray()`](#schemaresolverarray)
- [`schemaResolverDefault()`](#schemaresolverdefault)
- [`resolveSchema()`](#resolveschema)
- [`objectValueResolver()`](#objectvalueresolver)
- [`arrayValueResolver()`](#arrayvalueresolver)
- [`defaultValueResolver()`](#defaultvalueresolver)
- [`schemaEnv()`](#schemaenv)
- [`UnresolvedSchema`](#unresolvedschema)
- [`ResolvedSchema`](#resolvedschema)
- [`ResolveSchemaContext`](#resolveschemacontext)
- [`ValidationSpec`](#validationspec)
- [`CollectValidationsContext`](#collectvalidationscontext)
- [`BuiltInType`](#builtintype)
- [`ValidationError`](#validationerror)
- [`validateAsync()`](#validateasync)
- [`validateSync()`](#validatesync)
- [`validateSyncThrow()`](#validatesyncthrow)

##### `validationCollectorObject()`



##### `validationCollectorArray()`



##### `validationCollectorString()`



##### `validationCollectorNumber()`



##### `validationCollectorBoolean()`



##### `validationCollectorDefault()`



##### `collectValidations()`



##### `schemaTypeExpression()`



##### `ENUM`



##### `STRING_MIN_LENGTH`



##### `STRING_MAX_LENGTH`



##### `NUMBER_MIN`



##### `NUMBER_MAX`



##### `NUMBER_MULTIPLE_OF`



##### `ARRAY_MIN_LENGTH`



##### `ARRAY_MAX_LENGTH`



##### `ARRAY_EXACT_LENGTH`



##### `ARRAY_UNIQUE_ITEMS`



##### `OBJECT_UNKNOWN_PROPERTIES`



##### `parseValidationCases()`



##### `schemaResolverFunction()`



##### `schemaResolverExpression()`



##### `schemaResolverObject()`



##### `schemaResolverArray()`



##### `schemaResolverDefault()`



##### `resolveSchema()`



##### `objectValueResolver()`



##### `arrayValueResolver()`



##### `defaultValueResolver()`



##### `schemaEnv()`



##### `UnresolvedSchema`



##### `ResolvedSchema`



##### `ResolveSchemaContext`



##### `ValidationSpec`



##### `CollectValidationsContext`



##### `BuiltInType`



##### `ValidationError`



##### `validateAsync()`



##### `validateSync()`



##### `validateSyncThrow()`

Performs same validation process as `validateSync` but if an error
is encountered throws a `ValidationError`.
