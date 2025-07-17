import type { ViewProps } from 'react-native';
import type {
  DirectEventHandler,
  Int32,
} from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

type OnNitroIdChangeEvent = Readonly<{
  nitroId: Int32;
}>;

export interface ViewViewNativeProps extends ViewProps {
  nitroId: Int32;
  onNitroIdChange?: DirectEventHandler<OnNitroIdChangeEvent>;
}

export default codegenNativeComponent<ViewViewNativeProps>('RNCVideoView');
