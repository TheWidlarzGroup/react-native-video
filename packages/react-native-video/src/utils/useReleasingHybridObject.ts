import { useEffect, useMemo, useRef, type DependencyList } from 'react';
import type { HybridObject } from 'react-native-nitro-modules';

// https://github.com/expo/expo/blob/main/packages/expo-modules-core/src/hooks/useReleasingSharedObject.ts

/**
 * A hook that helps to manage the lifecycle of a hybrid object in a React component.
 *
 * @param config - An object containing the object factory and optional cleanup functions.
 * @param dependencies - An array of dependencies that determine when the object should be recreated.
 * @returns The hybrid object.
 */
export const useReleasingHybridObject = <THybridObject extends HybridObject>(
  config: {
    objectFactory: () => THybridObject;
    objectCleanup?: (object: THybridObject) => void;
  },
  dependencies: DependencyList
): THybridObject => {
  const objectRef = useRef<THybridObject | null>(null);
  const isFastRefresh = useRef(false);
  const previousDependencies = useRef(dependencies);

  if (objectRef.current == null) {
    objectRef.current = config.objectFactory();
  }

  const object = useMemo(() => {
    let newObject = objectRef.current;
    const depsAreEqual =
      previousDependencies.current?.length === dependencies.length &&
      dependencies.every(
        (value, index) => value === previousDependencies.current[index]
      );

    if (!newObject || !depsAreEqual) {
      // Destroy the old object
      if (objectRef.current) {
        config.objectCleanup?.(objectRef.current);
      }
      objectRef.current?.dispose();
      objectRef.current = null;

      // Create a new object
      newObject = config.objectFactory();
      objectRef.current = newObject;

      // Update the previous dependencies
      previousDependencies.current = dependencies;
    } else {
      isFastRefresh.current = true;
    }

    return newObject;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  useEffect(() => {
    isFastRefresh.current = false;

    return () => {
      if (!isFastRefresh.current && objectRef.current) {
        config.objectCleanup?.(objectRef.current);
        objectRef.current.dispose();
        objectRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return object;
};
