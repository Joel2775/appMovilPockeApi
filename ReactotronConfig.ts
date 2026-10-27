
import Reactotron from 'reactotron-react-native'

if (__DEV__) {
  Reactotron
    .configure({
      name: 'Mi Proyecto Expo',
    })
    .useReactNative()
    .connect()
}

export default Reactotron
