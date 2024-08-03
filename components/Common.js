import Cfg from './Cfg.js'
import Render from './common/Render.js'

const Common = {
  render: async function (arg1, arg2, arg3, arg4) {
    if (arguments.length === 4 && typeof (arguments[1]) === 'string') {
      return Render.render(arg2, arg3, {
        ...arg4,
        plugin: arg1
      })
    } else {
      return Render.render(arg1, arg2, arg3)
    }
  },
  sleep (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  },
}

export default Common
