import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DependencyList,
} from 'react';

/**
 * @internal
 * A hook that helps to manage the lifecycle of a native instance in a React component.
 * It allows instance to be recreated when dependencies change, but not when the component is hot reloaded.
 *
 * @param config.factory - The factory function that creates the instance.
 * @param config.cleanup - The cleanup function that destroys the instance.
 * @param config.dependenciesEqualFn - The function that compares the dependencies.
 *
 * @param dependencies - The dependencies array.
 * @returns The managed instance.
 */
export const useManagedInstance = <T, D extends DependencyList[number]>(
  config: {
    factory: () => T;
    cleanup: (object: T) => void;
    dependenciesEqualFn?: (a: D, b?: D) => boolean;
  },
  dependencies: D[]
): T => {
  const { factory, cleanup, dependenciesEqualFn } = config;

  const objectRef = useRef<T | null>(null);
  const isFastRefresh = useRef(false);
  const previousDependencies = useRef(dependencies);

  // Wee need to force a "re-render" to recalculate the object
  const [released, setReleased] = useState(false);

  if (objectRef.current == null) {
    objectRef.current = factory();
  }

  const object = useMemo(() => {
    let newObject = objectRef.current;

    const dependenciesChanged =
      previousDependencies.current?.length === dependencies.length &&
      dependencies.every(
        (value, index) =>
          dependenciesEqualFn?.(value, previousDependencies.current[index]) ??
          value === previousDependencies.current[index]
      );

    if (!newObject || !dependenciesChanged || released) {
      // Destroy the old object
      if (objectRef.current) {
        cleanup(objectRef.current);
        objectRef.current = null;
      }

      // Create a new object
      newObject = factory();
      objectRef.current = newObject;
      setReleased(false);

      // Update the previous dependencies
      previousDependencies.current = dependencies;
    } else {
      // If useMemo is re-evaluated, but dependencies are the same
      // and object is still the same, we can assume that that
      // the component is being hot reloaded
      isFastRefresh.current = true;
    }

    return newObject;

    // factory and cleanup are stable, so we don't need to re-evaluate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, released]);

  useEffect(() => {
    isFastRefresh.current = false;

    return () => {
      if (!isFastRefresh.current && objectRef.current) {
        cleanup(objectRef.current);
        objectRef.current = null;
        setReleased(true);
      }
    };

    // factory and cleanup are stable, so we don't need to re-evaluate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return object;
};
