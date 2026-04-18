import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@styles/theme';

interface CustomSafeAreaProps {
  children: React.ReactNode;
  backgroundColor?: string;
}

export function SafeArea({ children, backgroundColor }: CustomSafeAreaProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: backgroundColor || theme.colors.background,
      }}
    >
      {children}
    </SafeAreaView>
  );
}
