import { useMemo, useRef, useEffect } from 'react';
import type { HybridObject } from 'react-native-nitro-modules';

// https://github.com/expo/expo/blob/main/packages/expo-modules-core/src/hooks/useReleasingSharedObject.ts

/**
 * A hook that helps to manage the lifecycle of a hybrid object in a React component.
 * 
 * @param objectFactory - A function that creates a new hybrid object.
 * @param dependencies - An array of dependencies that determine when the object should be recreated.
 * @returns The hybrid object.
 */
export const useReleasingHybridObject = <THybridObject extends HybridObject>(
  objectFactory: () => THybridObject,
  dependencies: unknown[]
): THybridObject => {
  const objectRef = useRef<THybridObject | null>(null);
  const isFastRefresh = useRef(false);
  const previousDependencies = useRef(dependencies);

  if (objectRef.current == null) {
    objectRef.current = objectFactory();
  }

  const object = useMemo(() => {
    let newObject = objectRef.current;
    const depsAreEqual =
      previousDependencies.current?.length === dependencies.length &&
      dependencies.every((value, index) => value === previousDependencies.current[index]);

    if (!newObject || !depsAreEqual) {
      // Destroy the old object
      objectRef.current?.dispose();
      objectRef.current = null;

      // Create a new object
      newObject = objectFactory();
      objectRef.current = newObject;

      // Update the previous dependencies
      previousDependencies.current = dependencies;
    } else {
      isFastRefresh.current = true;
    }
    
    return newObject;
  }, dependencies);

  useEffect(() => {
    isFastRefresh.current = false;

    return () => {
      if (!isFastRefresh.current && objectRef.current) {
        objectRef.current.dispose();
        objectRef.current = null;
      }
    };
  }, []);

  return object;
};
