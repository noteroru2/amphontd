import postsData from '../data/local-posts.generated.json';
import {
	buildPostIndexPolicy,
	isIndexLifecycle,
	isRoutableLifecycle,
} from './post-index-policy.mjs';
import { applyMoneyOwnershipOverrides } from './money-query-ownership.mjs';

export interface LocalFeaturedImage {
	src: string;
	alt?: string;
	width?: number | null;
	height?: number | null;
}

export interface LocalPost {
	slug: string;
	date: string;
	modified: string;
	link: string;
	title: { rendered: string };
	excerpt: { rendered: string };
	content: { rendered: string };
	featuredImage?: LocalFeaturedImage | null;
	tags?: string[];
}

export type FeaturedImageAttrs = {
	src: string;
	width: number;
	height: number;
	alt: string;
};

export interface PostIndexPolicy {
	lifecycle: 'INDEX' | 'HOLD_NOINDEX' | 'REDIRECT' | 'GONE';
	reason: string;
	ownerSlug?: string;
	ownerPath?: string;
}

const posts = [...(postsData as LocalPost[])].sort((a, b) => {
	const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
	if (dateDiff !== 0) return dateDiff;
	return a.slug.localeCompare(b.slug);
});

const postIndexPolicy = applyMoneyOwnershipOverrides(
	buildPostIndexPolicy(posts),
) as Map<string, PostIndexPolicy>;

export function getAllPosts(): LocalPost[] {
	return posts;
}

export function getIndexablePosts(): LocalPost[] {
	return posts.filter((post) => isIndexLifecycle(postIndexPolicy.get(post.slug)));
}

export function getRoutablePosts(): LocalPost[] {
	return posts.filter((post) => isRoutableLifecycle(postIndexPolicy.get(post.slug)));
}

export function getPostIndexPolicy(postOrSlug: LocalPost | string): PostIndexPolicy {
	const slug = typeof postOrSlug === 'string' ? postOrSlug : postOrSlug.slug;
	return (
		postIndexPolicy.get(slug) ?? {
			lifecycle: 'HOLD_NOINDEX',
			reason: 'missing_policy',
		}
	);
}

export function findPostBySlug(slug: string): LocalPost | undefined {
	return posts.find((post) => post.slug === slug);
}

export function getPostTags(post: LocalPost): string[] {
	return post.tags?.filter(Boolean) ?? [];
}

export function getFeaturedImageUrl(post: LocalPost): string | undefined {
	return post.featuredImage?.src;
}

export function getFeaturedImageAlt(post: LocalPost): string {
	return post.featuredImage?.alt || post.title.rendered.replace(/<[^>]+>/g, '').trim();
}

export function getFeaturedImageAttrs(post: LocalPost): FeaturedImageAttrs | null {
	const image = post.featuredImage;
	if (!image?.src) return null;

	return {
		src: image.src,
		width: image.width ?? 1200,
		height: image.height ?? 675,
		alt: getFeaturedImageAlt(post),
	};
}
