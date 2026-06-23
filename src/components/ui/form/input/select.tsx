import { Picker, type PickerItemValue, type PickerProps } from "@expo/ui";
import type { FC } from "react";
import { Presets } from 'react-native-pulsar';

interface SelectProps extends PickerProps {
  options: {
    label: string;
    value: string;
  }[]
}

const Select: FC<SelectProps> = ({
  options,
  ...props
}) => {

  const handleValueChange = (value: PickerItemValue) => {
    Presets.System.selection()
    props.onValueChange?.(value);
  }

  return <Picker {...props} appearance="menu"
    onValueChange={handleValueChange}
  >
    {options.map((option) => (
      <Picker.Item
        key={option.value}
        label={option.label}
        value={option.value}
      />
    ))}
  </Picker>
}

Select.displayName = "Select";

export { Select };