import Client from './client';

export const runtime = 'edge';

export default async function Page(props: any) {
  return <Client {...props} />;
}