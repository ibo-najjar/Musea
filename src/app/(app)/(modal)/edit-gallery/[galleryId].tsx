import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { cn, Description, FieldError, Label, TextField } from "heroui-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import z from "zod";
import ModalCloseButton from "@/components/layout/modal-close-button";
import ModalSubmitButton from "@/components/layout/modal-submit-button";
import { Switch } from "@/components/ui/form/input/switch";
import { Input } from "@/components/ui/input";
import ScrollView from "@/components/ui/scrollview";
import { Text } from "@/components/ui/text";
import { useAppToast } from "@/lib/toast";
import { api } from "~/convex/_generated/api";
import type { Id } from "~/convex/_generated/dataModel";

const editGallerySchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name is too long"),
	autoFileEnabled: z.boolean(),
});

type EditGalleryForm = z.infer<typeof editGallerySchema>;

export default function EditGalleryScreen() {
	const { galleryId } = useLocalSearchParams<{ galleryId: string }>();
	const router = useRouter();

	const gallery = useQuery(api.galleries.getGalleryById, {
		galleryId: galleryId as Id<"gallery">,
	});
	const updateGallery = useMutation(api.galleries.updateGallery);
	const toast = useAppToast();

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<EditGalleryForm>({
		resolver: zodResolver(editGallerySchema),
		defaultValues: { name: "", autoFileEnabled: true },
	});

	// Seed the form once the gallery loads
	useEffect(() => {
		if (gallery) {
			reset({
				name: gallery.title,
				autoFileEnabled: !gallery.autoFileDisabled,
			});
		}
	}, [gallery, reset]);

	const onSubmit = async (data: EditGalleryForm) => {
		try {
			await updateGallery({
				galleryId: galleryId as Id<"gallery">,
				title: data.name,
				autoFileDisabled: !data.autoFileEnabled,
			});
			toast.success("Gallery updated");
			router.back();
		} catch (err) {
			toast.error(
				"Couldn't update gallery",
				err instanceof Error ? err.message : undefined,
			);
		}
	};

	return (
		<>
			<Stack.Screen options={{ title: gallery?.title ?? "Edit Gallery" }} />
			<ModalSubmitButton
				disabled={isSubmitting || gallery === undefined}
				onClick={handleSubmit(onSubmit)}
				isLoading={isSubmitting}
			/>
			<ModalCloseButton />
			<ScrollView
				className="bg-transparent"
				contentInsetAdjustmentBehavior="automatic"
				contentContainerClassName="px-4 gap-4 mb-20"
			>
				<TextField>
					<Label>Gallery name</Label>
					<Controller
						control={control}
						name="name"
						render={({ field: { onChange, value } }) => (
							<Input
								value={value}
								onChangeText={onChange}
								placeholder="Enter gallery name"
								className="shadow-none"
							/>
						)}
					/>
					<Description
						className={cn({
							invisible: !!errors.name,
						})}
					>
						This name helps us auto-sort items for you. You can change it later.
					</Description>
					<FieldError isInvalid={!!errors.name}>
						{errors.name?.message}
					</FieldError>
				</TextField>
				<View className="flex-row items-center justify-between">
					<View className="flex-1 pr-4">
						<Text className="font-medium text-foreground text-sm">
							Auto-file new saves
						</Text>
						<Text className="mt-0.5 text-muted text-xs">
							Let AI file matching saves into this gallery automatically.
						</Text>
					</View>
					<Controller
						control={control}
						name="autoFileEnabled"
						render={({ field: { onChange, value } }) => (
							<Switch isSelected={value} onSelectedChange={onChange} />
						)}
					/>
				</View>
			</ScrollView>
		</>
	);
}
