import { getCollection, type CollectionEntry } from 'astro:content';

export type NewsEntry = CollectionEntry<'news'>;

export async function getNews(): Promise<NewsEntry[]> {
  const posts = await getCollection('news');
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
