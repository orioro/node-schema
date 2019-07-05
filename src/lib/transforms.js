import set from 'lodash.set'
import get from 'lodash.get'
import cloneDeep from 'lodash.cloneDeep'
import merge from 'lodash.merge'

const REFERENCE_PATH_RE = /^\$(.+)$/

const _applyTransform = (target, transform, context) => {
  return Object.keys(transform).reduce((acc, targetPath) => {
    const value = transform[targetPath]

    const match = typeof value === 'string' && value.match(REFERENCE_PATH_RE)

    if (match) {
      const contextValue = get(context, match[1])
      set(acc, targetPath, typeof contextValue === 'object' ? cloneDeep(contextValue) : contextValue)
    } else {
      set(acc, targetPath, value)
    }

    return acc

  }, cloneDeep(target))
}

export const applyTransforms = (transforms, target, context) => {
  return transforms.reduce((acc, transform) => {
    return _applyTransform(acc, transform, context)
  }, target)
}
