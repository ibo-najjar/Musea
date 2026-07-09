import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import {
	cn,
	Description,
	FieldError,
	InputGroup,
	Label,
	TextField,
	useThemeColor,
} from "heroui-native";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import z from "zod";
import ModalCloseButton from "@/components/layout/modal-close-button";
import ModalSubmitButton from "@/components/layout/modal-submit-button";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/form/input/switch";
import { Input } from "@/components/ui/input";
import ScrollView from "@/components/ui/scrollview";
import { Text } from "@/components/ui/text";
import { TouchableGlass } from "@/components/ui/touchable-glass";
import { useAppToast } from "@/lib/toast";
import { api } from "~/convex/_generated/api";

const createGallerySchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name is too long"),
	autoFileEnabled: z.boolean(),
});

export type CreateGalleryForm = z.infer<typeof createGallerySchema>;

export default function CreateBoardSheet() {
	const { top } = useSafeAreaInsets();
	const createGallery = useMutation(api.galleries.createGallery);
	const toast = useAppToast();

	const accentForeground = useThemeColor("surface-secondary-foreground");

	const router = useRouter();

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<CreateGalleryForm>({
		resolver: zodResolver(createGallerySchema),
		defaultValues: { name: "", autoFileEnabled: true },
	});

	const onSubmit = async (data: CreateGalleryForm) => {
		try {
			await createGallery({
				title: data.name,
				autoFileDisabled: !data.autoFileEnabled,
			});
			toast.success("Gallery created");
			router.back();
		} catch (err) {
			toast.error(
				"Couldn't create gallery",
				err instanceof Error ? err.message : undefined,
			);
		}
	};

	return (
		<>
			<ModalSubmitButton
				disabled={isSubmitting}
				onClick={handleSubmit(onSubmit)}
				isLoading={isSubmitting}
			/>
			<ModalCloseButton />
			<ScrollView
				className="bg-transparent"
				contentInsetAdjustmentBehavior="automatic"
				// contentContainerStyle={{ paddingTop: top }}
				contentContainerClassName="px-4 gap-4 mb-20"
			>
				<Button
					className="mx-auto size-40 rounded-4xl"
					isGlass
					variant="secondary"
				>
					<SymbolView
						name={"photo.badge.plus"}
						tintColor={accentForeground}
						size={64}
					/>
				</Button>
				<TextField>
					<Label>Gallery name</Label>
					<Controller
						control={control}
						name="name"
						render={({ field: { onChange, value } }) => (
							<Input
								value={value}
								onChangeText={onChange}
								placeholder="e.g. Italian recipes, apartment inspo..."
								className=""
							/>
						)}
					/>
					<Description
						className={cn({
							invisible: !!errors.name,
						})}
					>
						Be specific — this helps us auto-sort items for you! You can always
						change it later.
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
