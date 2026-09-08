import { useQuery } from '@tanstack/react-query';

export function Example() {
  return useQuery({ queryKey: ['projects'], queryFn: async () => [] }).data;
}
