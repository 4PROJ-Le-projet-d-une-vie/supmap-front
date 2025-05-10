import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import {useNavigation} from "@react-navigation/native";

export default function CameraScreen() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState<boolean>(false);
    const [qrData, setQrData] = useState<string | null>(null);
    const [isDetecting, setIsDetecting] = useState<boolean>(false);
    const navigation = useNavigation();

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const isValidCoordinatesArray = (data: string): boolean => {
        try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed.locations)) return false;
            return parsed.locations.every(
                (item: any) =>
                    typeof item === 'object' &&
                    typeof item.latitude === 'number' &&
                    typeof item.longitude === 'number'
            );
        } catch (e) {
            console.log(e);
            return false;
        }
    };

    const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
        if (scanned) return;

        setIsDetecting(true);

        if (!isValidCoordinatesArray(data)) {
            Alert.alert('QR Code invalide', 'Les données doivent être un tableau avec latitude et longitude.');
            setIsDetecting(false);
            return;
        }
        setScanned(true);
        setQrData(data);
        navigation.navigate('Home', {scannedRoute: JSON.parse(data)})
    };


    if (hasPermission === null) return <Text>Demande de permission…</Text>;
    if (hasPermission === false) return <Text>Permission refusée</Text>;

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                onBarcodeScanned={handleBarCodeScanned} // ⚠️ La prop correcte est `onBarcodeScanned`
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'], // ⚠️ La prop correcte est `barcodeTypes`
                }}
            >
                {scanned && (
                    <View style={styles.scannedData}>
                        <Text>QR Code Scanné: {qrData}</Text>
                        <Text style={styles.reset} onPress={() => setScanned(false)}>
                            Scanner à nouveau
                        </Text>
                    </View>
                )}
                {isDetecting && (
                    <View style={styles.qrDetected}>
                        <Text style={styles.qrText}>QR détecté...</Text>
                    </View>
                )}
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    camera: {
        flex: 1,
        width: '100%',
    },
    scannedData: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -150 }, { translateY: -50 }],
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 10,
        zIndex: 10,
    },
    reset: {
        marginTop: 10,
        color: 'blue',
        textDecorationLine: 'underline',
    },
    qrDetected: {
        position: 'absolute',
        top: 50,
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 255, 0, 0.7)',
        padding: 10,
        borderRadius: 8,
        zIndex: 20,
    },
    qrText: {
        color: 'white',
        fontWeight: 'bold',
    },

});
