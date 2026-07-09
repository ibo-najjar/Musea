const FROM_EMAIL = process.env.MUSEA_FROM_EMAIL ?? "onboarding@museaapp.com";

export async function sendEmail({
	to,
	subject,
	text,
}: {
	to: string;
	subject: string;
	text: string;
}) {
	const res = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: FROM_EMAIL,
			to,
			subject,
			text,
		}),
	});

	if (!res.ok) {
		throw new Error(`Failed to send email: ${res.status} ${await res.text()}`);
	}
}
