import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import {
	cn,
	Description,
	FieldError,
	Input,
	InputGroup,
	Label,
	TextField,
	useThemeColor,
} from "heroui-native";
import { Controller, useForm } from "react-hook-form";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import z from "zod";
import ModalCloseButton from "@/components/layout/modal-close-button";
import ModalSubmitButton from "@/components/layout/modal-submit-button";
import { Button } from "@/components/ui/button";
import ScrollView from "@/components/ui/scrollview";
import { TouchableGlass } from "@/components/ui/touchable-glass";
import { api } from "~/convex/_generated/api";

const createGallerySchema = z.object({
	name: z.string().min(1).max(100),
});

export type CreateGalleryForm = z.infer<typeof createGallerySchema>;

export default function CreateBoardSheet() {
	const { top } = useSafeAreaInsets();
	const createGallery = useMutation(api.galleries.createGallery);

	const accentForeground = useThemeColor("surface-secondary-foreground");

	const router = useRouter();

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<CreateGalleryForm>({
		resolver: zodResolver(createGallerySchema),
		defaultValues: { name: "" },
	});

	const onSubmit = async (data: CreateGalleryForm) => {
		await createGallery({ title: data.name });
		router.back();
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
					className="size-40 mx-auto rounded-4xl"
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
					<FieldError isInvalid={!!errors.name}>Heyyyy</FieldError>
				</TextField>
			</ScrollView>
		</>
	);
}
