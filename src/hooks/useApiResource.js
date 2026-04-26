import { useCallback, useEffect, useState } from "react";

export default function useApiResource(loader, dependencies = [], options = {}) {
  const { enabled = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!enabled) return null;

    setLoading(true);
    setError(null);
    try {
      const response = await loader();
      setData(response);
      return response;
    } catch (resourceError) {
      console.log(resourceError);
      setError(resourceError);
      return null;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
