import postsData from '../data/local-posts.generated.json';

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

const posts = [...(postsData as LocalPost[])].sort((a, b) => {
	const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
	if (dateDiff !== 0) return dateDiff;
	return a.slug.localeCompare(b.slug);
});

export function getAllPosts(): LocalPost[] {
	return posts;
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
