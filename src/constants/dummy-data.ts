export type SavedItem = {
	id: string;
	type: "tweet" | "instagram" | "reddit" | "youtube" | "article" | "image";
	title: string;
	summary: string;
	tags: string[];
	thumbnail: string;
	height: number; // randomized to simulate masonry
	source: string;
};

// source type enum

export const dummy_userId = "12345";

enum SourceType {
	TWEET = "x.com",
	INSTAGRAM = "instagram.com",
	REDDIT = "reddit.com",
	YOUTUBE = "youtube.com",
	ARTICLE = "medium.com",
	IMAGE = "pinterest.com",
}

export const DUMMY_DATA: SavedItem[] = [
	{
		id: "1",
		type: "tweet",
		title: "On building great products",
		summary:
			"The best products don't just solve problems — they make people feel something.",
		tags: ["product", "design"],
		thumbnail:
			"https://i.pinimg.com/1200x/57/6f/8b/576f8bd9729a86b0276e22f70b5db9b8.jpg",
		height: 180,
		source: "x.com",
	},
	{
		id: "2",
		type: "youtube",
		title: "How Attention Mechanisms Work",
		summary:
			"A deep visual explanation of transformers and self-attention from scratch.",
		tags: ["AI", "learning"],
		thumbnail:
			"https://i.pinimg.com/1200x/63/c6/97/63c697015e0e20efa0b08e29fb4f2c3b.jpg",
		height: 260,
		source: "youtube.com",
	},
	{
		id: "3",
		type: "article",
		title: "The Unreasonable Effectiveness of Just Shipping",
		summary:
			"Why launching beats planning every time, and how to get comfortable with imperfect.",
		tags: ["startups", "productivity"],
		thumbnail:
			"https://i.pinimg.com/1200x/f7/da/80/f7da80da47b46eb207bc860cbdf89f84.jpg",
		height: 210,
		source: "medium.com",
	},
	{
		id: "4",
		type: "image",
		title: "Minimalist workspace inspo",
		summary: "Clean desk setup with neutral tones and a single monitor.",
		tags: ["design", "workspace"],
		thumbnail:
			"https://i.pinimg.com/1200x/f2/d9/10/f2d910c10b757758dc6bf7cf24eea6d9.jpg",
		height: 300,
		source: "instagram.com",
	},
	{
		id: "5",
		type: "reddit",
		title: "What nobody tells you about compound interest",
		summary:
			"A thread breaking down why starting at 22 vs 32 is a $400k difference.",
		tags: ["finance", "investing"],
		thumbnail:
			"https://i.pinimg.com/1200x/9c/e7/20/9ce7202424c29a3d8f7be75d72a22b1b.jpg",
		height: 200,
		source: "reddit.com",
	},
	{
		id: "6",
		type: "instagram",
		title: "Typography poster series",
		summary:
			"Bold experimental type layouts using negative space and contrast.",
		tags: ["typography", "design"],
		thumbnail:
			"https://i.pinimg.com/1200x/ed/5c/60/ed5c60c9a79da374551e51bb07bf18ba.jpg",
		height: 280,
		source: "instagram.com",
	},
	{
		id: "7",
		type: "article",
		title: "Why sleep is the ultimate performance drug",
		summary:
			"Matthew Walker's key insights condensed — REM cycles, memory, and longevity.",
		tags: ["health", "science"],
		thumbnail:
			"https://i.pinimg.com/1200x/25/d0/0d/25d00d86b1225d2c3aaed754456b80fa.jpg",
		height: 220,
		source: "hubermanlab.com",
	},
	{
		id: "8",
		type: "tweet",
		title: "Contrarian takes on remote work",
		summary:
			"Async-first isn't about tools. It's about writing clearly enough that you rarely need a meeting.",
		tags: ["work", "remote"],
		thumbnail:
			"https://i.pinimg.com/736x/71/f9/42/71f942d56b9115db63151746c69f6252.jpg",
		height: 160,
		source: "x.com",
	},
	{
		id: "9",
		type: "youtube",
		title: "Dieter Rams: 10 Principles of Good Design",
		summary:
			"A documentary revisiting Rams' timeless design philosophy and its influence on Apple.",
		tags: ["design", "history"],
		thumbnail:
			"https://i.pinimg.com/1200x/c5/a5/4f/c5a54f096ecc8b2fafee245068d074b8.jpg",
		height: 260,
		source: "youtube.com",
	},
	{
		id: "10",
		type: "image",
		title: "Color palette study — earth tones",
		summary:
			"Warm ochre, terracotta, and sage combinations for UI and brand work.",
		tags: ["color", "design"],
		thumbnail:
			"https://i.pinimg.com/736x/b4/b8/2c/b4b82c52261a4b796ba572bf2456ec8e.jpg",
		height: 240,
		source: "pinterest.com",
	},
	{
		id: "11",
		type: "reddit",
		title: "Ask HN: How do you stay focused in 2024?",
		summary:
			"Top responses: phone in another room, time-blocked calendar, no Slack on weekends.",
		tags: ["productivity", "focus"],
		thumbnail:
			"https://i.pinimg.com/736x/72/8c/b6/728cb689d4ab75e8fd98fb4e2822a375.jpg",
		height: 190,
		source: "reddit.com",
	},
	{
		id: "12",
		type: "article",
		title: "The philosophy behind Apple's silence",
		summary:
			"Why Apple rarely responds to critics — and how restraint became a brand strategy.",
		tags: ["apple", "strategy"],
		thumbnail:
			"https://i.pinimg.com/736x/7e/59/cb/7e59cbfa1db91c2e8e0cac44edcc8e04.jpg",
		height: 230,
		source: "stratechery.com",
	},
];

export const BOARDS = [
	{ id: "1", name: "Design Inspo", items: DUMMY_DATA.slice(0, 6) },
	{ id: "2", name: "AI & Tech", items: DUMMY_DATA.slice(2, 8) },
	{ id: "3", name: "Productivity", items: DUMMY_DATA.slice(4, 10) },
	{ id: "4", name: "Workspace", items: DUMMY_DATA.slice(6, 12) },
	{ id: "5", name: "Typography", items: DUMMY_DATA.slice(1, 7) },
	{ id: "6", name: "Finance", items: DUMMY_DATA.slice(3, 9) },
];
