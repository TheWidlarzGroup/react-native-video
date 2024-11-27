# react-native-video

This is (PoC) v7 version of the react-native-video library.
It's experimental and not recommended for production use.

It's working both on New and Old Architecture.

## Requirements

- Please see [nitro requirements](https://nitro.margelo.com/docs/minimum-requirements)
- React Native 0.75 or higher

## Installation

You have to install `react-native-nitro-modules` (>=0.13.0) in your project.
```sh
yarn install react-native-nitro-modules
```

Then install the package

> [!IMPORTANT]  
> This package is not published on npm yet. You have to install it from the local path.

```sh
yarn install react-native-video
```

## Usage


```js
import * as React from 'react';
import { VideoView, createPlayer } from "react-native-video";

const VideoPlayer = () => {

  // Remember to create a player instance outside of the render method to avoid creating a new instance on each render
  // You can also use useMemo to memoize the player instance
  const player = React.useMemo(() => createPlayer('https://www.w3schools.com/html/mov_bbb.mp4'), []);

  // Usage of player

  // Methods
  player.play();
  player.pause();

  // Properties
  player.currentTime = 10;
  player.volume = 0.5;

  // Usage of VideoView
  return (
    <VideoView
      player={player}
      style={{ width: 300, height: 300 }}
    />
  );
};
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

[Custom](LICENSE)

This project is provided solely for demonstration and contribution purposes. Forking is permitted exclusively for submitting changes to the [main repository](https://github.com/TheWidlarzGroup/react-native-video-v7). The code and its modifications may only be used within this repository or an authorized fork. Commercial use of the code is prohibited unless you have permission from TheWidlarzGroup

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
