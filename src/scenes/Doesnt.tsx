import { BigText } from "../components/BigText";
import { Center } from "../components/Center";
import { theme } from "../theme";

// "It doesn't really show you how I think, what I can build, or what I can actually do."
export const Doesnt: React.FC = () => (
  <Center gap={2}>
    <BigText size={5} weight={600} color={theme.muted}>It doesn’t show you…</BigText>
    <BigText delay={15} size={11}>how I think.</BigText>
    <BigText delay={40} size={11}>what I build.</BigText>
    <BigText delay={65} size={11} color={theme.accent}>what I can do.</BigText>
  </Center>
);
