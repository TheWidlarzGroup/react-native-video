interface IComponentInitialProps extends Record<string, any> {
  componentId: string;
}

export interface IComponent {
  buttonIconUrl?: string;
  height?: number;
  width?: number;
  name: string;
  initialProps: IComponentInitialProps;
}

export interface IPlugins {
  bottom?: IComponent;
}