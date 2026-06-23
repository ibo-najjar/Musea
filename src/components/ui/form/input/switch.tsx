import {
  Switch as HerouiSwitch,
  type SwitchProps as HerouiSwitchProps,
} from "heroui-native";

type SwitchProps = HerouiSwitchProps;

const Switch = (props: SwitchProps) => {
  return <HerouiSwitch {...props} />;
};

Switch.displayName = "Switch";

export { Switch };