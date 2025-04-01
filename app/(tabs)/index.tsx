import { Image, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native';
import MapComponent from '../../components/MapComponent'; // Ajuste le chemin

export default function HomeScreen() {
  return (
      <SafeAreaView style={{ flex: 1 }}>
          <MapComponent />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
